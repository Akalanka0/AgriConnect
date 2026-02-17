import { GeneratedId, User, FarmerDetail, InstructorDetail, SystemSetting, Message } from '../../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendAdminInvitationEmail } from '../../services/emailService.js';

/**
 * Update Admin Profile
 * PUT /api/admin/profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        // If there's an uploaded file (from Cloudinary middleware)
        if (req.file && req.file.path) {
            user.avatar = req.file.path.replace(/\\/g, '/');
            user.profile_picture = user.avatar; // Sync profile_picture field
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update profile',
                details: error.message
            }
        });
    }
};

/**
 * Remove Admin Profile Picture
 * DELETE /api/admin/profile/picture
 */
export const removeProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        user.profile_picture = null;
        user.avatar = null; // Sync avatar field
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile picture removed successfully',
            data: { avatar: null }
        });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to remove profile picture' } });
    }
};

/**
 * Update Admin Password
 * PUT /api/admin/password
 */
export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Incorrect current password' }
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update password',
                details: error.message
            }
        });
    }
};

// Helper for generating random IDs or passwords
const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
        .toUpperCase();
};

/**
 * Get Dashboard Stats
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        // Count users by role
        const totalUsers = await User.count();
        const farmers = await User.count({ where: { role: 'farmer' } });
        const instructors = await User.count({ where: { role: 'instructor' } });
        const admins = await User.count({
            where: {
                role: { [Op.in]: ['admin', 'Super Admin'] }
            }
        });

        // Get recent activity (last 5 created users)
        const recentActivity = await User.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'full_name', 'role', 'created_at', 'status']
        });

        return res.status(200).json({
            success: true,
            data: {
                counts: {
                    totalUsers,
                    farmers,
                    instructors,
                    admins
                },
                recentActivity
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch dashboard stats',
                details: error.message
            }
        });
    }
};

/**
 * Get System Settings
 * GET /api/admin/settings
 */
export const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            let value = s.setting_value;
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            settingsMap[s.setting_key] = value;
        });

        return res.status(200).json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        console.error('Error fetching system settings:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch system settings',
                details: error.message
            }
        });
    }
};

/**
 * Update System Setting
 * PUT /api/admin/settings/:key
 */
export const updateSystemSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const [setting, created] = await SystemSetting.findOrCreate({
            where: { setting_key: key },
            defaults: { setting_value: String(value) }
        });

        if (!created) {
            await setting.update({ setting_value: String(value) });
        }

        return res.status(200).json({
            success: true,
            message: 'Setting updated successfully',
            data: { [key]: value }
        });
    } catch (error) {
        console.error('Error updating system setting:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update system setting',
                details: error.message
            }
        });
    }
};

/**
 * Invite a new admin
 * POST /api/admin/invite
 */
export const inviteAdmin = async (req, res) => {
    try {
        const { fullName, email } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                error: { message: 'Full name and email are required' }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email already registered' }
            });
        }

        // Generate a random temporary password
        const tempPassword = generateRandomString(10);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

        // Generate valid and unique NIC and Phone
        // NIC: 9 digits + 'V'
        const nicPrefix = crypto.randomInt(100000000, 999999999).toString();
        // Phone: 07 + 8 digits
        const phoneSuffix = crypto.randomInt(10000000, 99999999).toString();

        // Create the admin user
        const newAdmin = await User.create({
            full_name: fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            email_verified: true,
            nic: `${nicPrefix}V`,
            phone: `07${phoneSuffix}`
        });

        // Send invitation email
        await sendAdminInvitationEmail(email, fullName, tempPassword);

        return res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: {
                id: newAdmin.id,
                name: newAdmin.full_name,
                email: newAdmin.email,
                role: newAdmin.role,
                status: 'Active'
            }
        });

    } catch (error) {
        console.error('Error inviting admin:', error);

        // Extract validation errors if any
        let message = 'Failed to send invitation';
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            message = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            message = error.message;
        }

        return res.status(500).json({
            success: false,
            error: {
                message: message,
                details: error.message
            }
        });
    }
};

export const getEngagementStats = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newRegistrations = await User.count({
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            }
        });

        const totalActiveUsers = await User.count({
            where: { status: 'active' }
        });

        const registrationTrend = await User.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        const activityByRole = await User.findAll({
            attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['role']
        });

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    newRegistrations,
                    totalActiveUsers,
                    dailyActive: Math.floor(totalActiveUsers * 0.3)
                },
                trend: registrationTrend,
                distribution: activityByRole
            }
        });

    } catch (error) {
        console.error('Error fetching engagement stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch engagement stats',
                details: error.message
            }
        });
    }
};

/**
 * Get Users with Filters
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
    try {
        const { role, search, status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (role) whereClause.role = role;
        if (status && status !== 'all') whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { nic: { [Op.like]: `%${search}%` } }
            ];
        }

        // Include specific details based on role
        let include = [];
        if (role === 'farmer') {
            include.push({ model: FarmerDetail, as: 'farmerDetail' });
        } else if (role === 'instructor') {
            include.push({ model: InstructorDetail, as: 'instructorDetail' });
        } else {
            // If no role specified, include both (left join)
            include.push({ model: FarmerDetail, as: 'farmerDetail' });
            include.push({ model: InstructorDetail, as: 'instructorDetail' });
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            attributes: { exclude: ['password'] }
        });

        // --- ENRICHMENT LOGIC START ---

        // 1. Fetch all instructors to map Divisions -> Instructor Names
        const allInstructors = await User.findAll({
            where: { role: 'instructor' },
            include: [{ model: InstructorDetail, as: 'instructorDetail' }],
            attributes: ['id', 'full_name']
        });

        const divisionToInstructor = {};
        allInstructors.forEach(inst => {
            const details = inst.instructorDetail;
            if (details && details.assigned_divisions) {
                let divisions = [];
                try {
                    divisions = typeof details.assigned_divisions === 'string'
                        ? JSON.parse(details.assigned_divisions)
                        : details.assigned_divisions;
                } catch (e) {
                    divisions = [];
                }

                if (Array.isArray(divisions)) {
                    divisions.forEach(div => {
                        divisionToInstructor[div] = inst.full_name;
                    });
                }
            }
        });

        // 2. Fetch Farmer Counts by Division
        const farmerCounts = await FarmerDetail.findAll({
            attributes: ['instructor_division', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['instructor_division'],
            raw: true
        });

        const divisionToCount = {};
        farmerCounts.forEach(item => {
            if (item.instructor_division) {
                divisionToCount[item.instructor_division] = parseInt(item.count, 10);
            }
        });

        // 3. Attach computed data to rows
        rows.forEach(user => {
            if (user.role === 'farmer') {
                const division = user.farmerDetail?.instructor_division;
                user.dataValues.instructor = division ? (divisionToInstructor[division] || 'Not Assigned') : 'Not Assigned';
            } else if (user.role === 'instructor') {
                const details = user.instructorDetail;
                let count = 0;
                if (details && details.assigned_divisions) {
                    let divisions = [];
                    try {
                        divisions = typeof details.assigned_divisions === 'string'
                            ? JSON.parse(details.assigned_divisions)
                            : details.assigned_divisions;
                    } catch (e) {
                        divisions = [];
                    }

                    if (Array.isArray(divisions)) {
                        divisions.forEach(div => {
                            count += (divisionToCount[div] || 0);
                        });
                    }
                }
                user.dataValues.farmersCount = count;
            }
        });
        // --- ENRICHMENT LOGIC END ---

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch users',
                details: error.message
            }
        });
    }
};

/**
 * Update User Status (Block/Unblock)
 * PUT /api/admin/users/:id/status
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'blocked', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid status'
                }
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found'
                }
            });
        }

        // Prevent blocking admins
        if (user.role === 'admin' || user.role === 'Super Admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Cannot block administrative users'
                }
            });
        }

        user.status = status;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${status} successfully`,
            data: {
                id: user.id,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update user status',
                details: error.message
            }
        });
    }
};

/**
 * Delete User
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found'
                }
            });
        }

        // Prevent deleting admins
        if (user.role === 'admin' || user.role === 'Super Admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Cannot delete administrative users'
                }
            });
        }

        // Associated details (FarmerDetail/InstructorDetail) will be deleted via ON DELETE CASCADE 
        // if configured in database, otherwise we should delete them manually.
        // To ensure consistency regardless of DB constraints:
        await FarmerDetail.destroy({ where: { user_id: id } });
        await InstructorDetail.destroy({ where: { user_id: id } });

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: { id }
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete user',
                details: error.message
            }
        });
    }
};

export const getInstructorEngagement = async (req, res) => {
    try {
        const instructors = await User.findAll({
            where: { role: 'instructor' },
            include: [{ model: InstructorDetail, as: 'instructorDetail' }]
        });

        const farmers = await User.findAll({
            where: { role: 'farmer' },
            include: [{ model: FarmerDetail, as: 'farmerDetail' }]
        });

        const engagementData = instructors.map(inst => {
            const details = inst.instructorDetail || {};
            let divisions = [];

            try {
                divisions = typeof details.assigned_divisions === 'string'
                    ? JSON.parse(details.assigned_divisions)
                    : (details.assigned_divisions || []);
            } catch (e) {
                divisions = [];
            }

            if (!Array.isArray(divisions)) divisions = [];

            const myFarmers = farmers.filter(f => {
                const fDetails = f.farmerDetail || {};
                return fDetails.instructor_division && divisions.includes(fDetails.instructor_division);
            });

            return {
                id: inst.id,
                displayId: details.instructor_id || `INST-${inst.id}`,
                name: inst.full_name,
                nic: inst.nic,
                phone: inst.phone,
                district: details.district || '-',
                zone: details.zone || '-',
                divisions: divisions,
                avatar: inst.avatar ? inst.avatar.replace(/\\/g, '/') : (inst.profile_picture ? inst.profile_picture.replace(/\\/g, '/') : null),
                averageRating: 0,
                farmersCount: myFarmers.length,
                farmers: myFarmers.map(f => ({
                    id: f.farmerDetail?.farmer_id || `FARM-${f.id}`,
                    name: f.full_name,
                    phone: f.phone,
                    district: f.farmerDetail?.district || '-',
                    zone: f.farmerDetail?.zone || '-',
                    instructorDivision: f.farmerDetail?.instructor_division || '-',
                    avatar: f.avatar ? f.avatar.replace(/\\/g, '/') : (f.profile_picture ? f.profile_picture.replace(/\\/g, '/') : null)
                })),
                reviews: []
            };
        });

        return res.status(200).json({
            success: true,
            data: engagementData
        });

    } catch (error) {
        console.error('Error fetching instructor engagement:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch instructor engagement',
                details: error.message
            }
        });
    }
};

/**
 * Generate 50 new IDs
 * POST /api/admin/ids/generate
 */
export const generateIds = async (req, res) => {
    try {
        const { type } = req.body;

        if (!['farmer', 'instructor'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid type. Must be farmer or instructor'
                }
            });
        }

        const year = new Date().getFullYear();
        const prefix = type === 'farmer' ? 'FARM' : 'INST';
        const newIds = [];
        const count = 50;

        // Generate 50 unique codes
        let attempts = 0;
        while (newIds.length < count && attempts < 100) {
            const suffix = generateRandomString(4);
            const code = `${prefix}-${year}-${suffix}`;

            // Check if already in current batch
            if (!newIds.find(item => item.code === code)) {
                newIds.push({
                    code,
                    type,
                    year,
                    status: 'active'
                });
            }
            attempts++;
        }

        const existingCodes = await GeneratedId.findAll({
            where: {
                code: {
                    [Op.in]: newIds.map(id => id.code)
                }
            },
            attributes: ['code']
        });

        const existingCodeSet = new Set(existingCodes.map(ec => ec.code));
        const uniqueIdsToInsert = newIds.filter(id => !existingCodeSet.has(id.code));

        if (uniqueIdsToInsert.length > 0) {
            await GeneratedId.bulkCreate(uniqueIdsToInsert);
        }

        return res.status(201).json({
            success: true,
            message: `Successfully generated ${uniqueIdsToInsert.length} IDs for ${type}`,
            count: uniqueIdsToInsert.length,
            data: uniqueIdsToInsert
        });

    } catch (error) {
        console.error('Error generating IDs:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to generate IDs',
                details: error.message
            }
        });
    }
};

/**
 * Get all generated IDs
 * GET /api/admin/ids
 */
export const getGeneratedIds = async (req, res) => {
    try {
        const { type, status } = req.query;

        const whereClause = {};
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        const ids = await GeneratedId.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: ids
        });
    } catch (error) {
        console.error('Error fetching IDs:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch IDs',
                details: error.message
            }
        });
    }
};

/**
 * Update ID status
 * PUT /api/admin/ids/:id/status
 */
export const updateIdStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'used'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid status. Must be active or used'
                }
            });
        }

        const generatedId = await GeneratedId.findByPk(id);

        if (!generatedId) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'ID not found'
                }
            });
        }

        await generatedId.update({ status });

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: generatedId
        });
    } catch (error) {
        console.error('Error updating ID status:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update status',
                details: error.message
            }
        });
    }
};

/**
 * Delete IDs by status
 * DELETE /api/admin/ids/prune
 */
export const deleteIdsByStatus = async (req, res) => {
    try {
        const { status, type } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Status is required'
                }
            });
        }

        const whereClause = { status };
        if (type) whereClause.type = type;

        const deletedCount = await GeneratedId.destroy({
            where: whereClause
        });

        return res.status(200).json({
            success: true,
            message: `Successfully deleted ${deletedCount} ${status} IDs`,
            count: deletedCount
        });
    } catch (error) {
        console.error('Error deleting IDs:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete IDs',
                details: error.message
            }
        });
    }
};

/**
 * Get Admin Messages
 * GET /api/admin/messages
 */
export const getMyMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { recipient_id: userId },
                    { recipient_type: 'all' },
                    { recipient_type: 'admin' },
                    { sender_id: userId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'full_name', 'role']
                },
                {
                    model: User,
                    as: 'recipient',
                    attributes: ['id', 'full_name', 'role']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const formattedMessages = messages.map(msg => {
            // Helper function to format custom ID with better error handling
            const formatCustomId = (user) => {
                if (!user) {
                    console.warn('⚠️ formatCustomId: user is null or undefined');
                    return 'Unknown User';
                }
                
                if (user.role === 'admin') {
                    return 'Admin';
                }
                
                // Handle missing or invalid full_name
                const fullName = user.full_name?.trim() || 'Unknown User';
                if (!fullName || fullName === 'null' || fullName === 'undefined') {
                    console.warn('⚠️ formatCustomId: user.full_name is empty/invalid:', user.full_name);
                    return 'Unknown User';
                }
                
                // Extract first name for display
                const firstName = fullName.split(' ')[0] || 'User';
                const paddedId = user.id < 10 ? `0${user.id}` : String(user.id);
                return `${firstName} (ID: INST-2026-HF${paddedId})`;
            };
            
            // Helper function to format recipient name with better error handling
            const formatRecipientName = (msg) => {
                if (msg.recipient_type === 'all') {
                    return 'All Users';
                }
                if (msg.recipient_type === 'admin') {
                    return 'All Admins';
                }
                if (!msg.recipient) {
                    console.warn('⚠️ formatRecipientName: msg.recipient is null or undefined');
                    return 'Unknown Recipient';
                }
                return formatCustomId(msg.recipient);
            };
            
            // Get formatted sender and recipient names with custom IDs
            const senderName = formatCustomId(msg.sender);
            const recipientName = formatRecipientName(msg);
            
            const messageType = msg.sender_id === userId ? 'sent' : 'received';

            return {
                id: msg.id,
                subject: msg.subject,
                content: msg.content,
                sender: senderName,
                senderId: msg.sender_id,
                recipient: recipientName,
                recipientId: msg.recipient_id,
                type: messageType,
                date: msg.created_at ? msg.created_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                time: msg.created_at ? msg.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attachment: msg.attachment_name,
                attachmentUrl: msg.attachment_url,
                is_read: msg.is_read
            };
        });

        return res.status(200).json({ success: true, data: formattedMessages });
    } catch (error) {
        console.error('Error fetching admin messages:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch messages' } });
    }
};

export const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const io = req.app.get('io'); // Get Socket.IO instance

        const message = await Message.findOne({
            where: {
                id,
                [Op.or]: [
                    { recipient_id: userId },  // Direct message
                    { recipient_type: 'all' },  // Broadcast to all
                    { recipient_type: 'admin' }  // Broadcast to admins
                ]
            }
        });

        if (!message) {
            return res.status(404).json({ success: false, error: { message: 'Message not found' } });
        }

        message.is_read = true;
        await message.save();

        // Emit WebSocket event for real-time update
        if (io) {
            io.emit('messageRead', id);
        }

        return res.status(200).json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to mark message as read' } });
    }
};
