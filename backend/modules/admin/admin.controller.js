import { GeneratedId, User, FarmerDetail, InstructorDetail, SystemSetting, Message, InstructorRating, Region, ReportHistory } from '../../models/index.js';
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
            user.profile_picture = req.file.path.replace(/\\/g, '/');
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
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update profile'
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
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile picture removed successfully',
            data: { profile_picture: null }
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

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: { message: 'Current password and new password are required' }
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters long' }
            });
        }

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
                message: 'Failed to update password'
            }
        });
    }
};

// Build { zone: [divisions] } hierarchy from regions rows
const buildHierarchy = (rows) => {
    const hierarchy = {};
    rows.forEach(r => {
        if (!hierarchy[r.zone]) hierarchy[r.zone] = [];
        // Only push if it's not already in the array, allowing division === zone
        if (!hierarchy[r.zone].includes(r.division)) {
            hierarchy[r.zone].push(r.division);
        }
    });
    return hierarchy;
};

/**
 * Get Region Hierarchy  (zone ? divisions map)
 */
export const getRegionHierarchy = async (req, res) => {
    try {
        const rows = await Region.findAll({ order: [['zone', 'ASC'], ['division', 'ASC']], raw: true });
        return res.status(200).json({ success: true, data: buildHierarchy(rows) });
    } catch (error) {
        console.error('Error fetching region hierarchy:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch region hierarchy' } });
    }
};

/**
 * Get Regions (flat list with IDs � for admin management UI)
 */
export const getRegions = async (req, res) => {
    try {
        const rows = await Region.findAll({ order: [['zone', 'ASC'], ['division', 'ASC']], raw: true });
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching regions:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch regions' } });
    }
};

/**
 * Add a new Zone (POST /api/admin/regions/zone)
 */
export const addRegionZone = async (req, res) => {
    try {
        const { zone, district = 'Anuradhapura' } = req.body;
        if (!zone || !zone.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Zone name is required' } });
        }
        const trimmed = zone.trim();
        const existing = await Region.findOne({ where: { zone: trimmed, division: trimmed }, raw: true });
        if (existing) {
            return res.status(409).json({ success: false, error: { message: `Zone '${trimmed}' already exists` } });
        }
        const row = await Region.create({ district: district.trim(), zone: trimmed, division: trimmed });
        return res.status(201).json({ success: true, message: 'Zone added successfully', data: row });
    } catch (error) {
        console.error('Error adding zone:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to add zone' } });
    }
};

/**
 * Add a Division to an existing Zone (POST /api/admin/regions/division)
 */
export const addRegionDivision = async (req, res) => {
    try {
        const { zone, division } = req.body;
        if (!zone || !zone.trim() || !division || !division.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Zone and division are required' } });
        }
        const zoneBase = await Region.findOne({ where: { zone: zone.trim(), division: zone.trim() }, raw: true });
        if (!zoneBase) {
            return res.status(404).json({ success: false, error: { message: `Zone '${zone.trim()}' does not exist` } });
        }
        if (division.trim() === zone.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Division name cannot be the same as zone name' } });
        }
        const existing = await Region.findOne({ where: { zone: zone.trim(), division: division.trim() }, raw: true });
        if (existing) {
            return res.status(409).json({ success: false, error: { message: `Division '${division.trim()}' already exists in zone '${zone.trim()}'` } });
        }
        const row = await Region.create({ district: zoneBase.district, zone: zone.trim(), division: division.trim() });
        return res.status(201).json({ success: true, message: 'Division added successfully', data: row });
    } catch (error) {
        console.error('Error adding division:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to add division' } });
    }
};

/**
 * Delete a Region row by ID (DELETE /api/admin/regions/:id)
 * Cannot delete a zone's base row if custom divisions exist under it.
 */
export const deleteRegionRow = async (req, res) => {
    try {
        const { id } = req.params;
        const row = await Region.findByPk(id);
        if (!row) {
            return res.status(404).json({ success: false, error: { message: 'Region entry not found' } });
        }
        // If this is a base row (zone === division), block deletion if sub-divisions exist
        if (row.zone === row.division) {
            const subDivCount = await Region.count({ where: { zone: row.zone, division: { [Op.ne]: row.zone } } });
            if (subDivCount > 0) {
                return res.status(409).json({
                    success: false,
                    error: { message: `Cannot delete zone '${row.zone}' � remove its ${subDivCount} division(s) first` }
                });
            }
        }
        await row.destroy();
        return res.status(200).json({ success: true, message: 'Region entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting region row:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to delete region entry' } });
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
                message: 'Failed to fetch dashboard stats'
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
                message: 'Failed to fetch system settings'
            }
        });
    }
};

const ALLOWED_SETTING_KEYS = ['maintenance_mode'];

/**
 * Update System Setting
 * PUT /api/admin/settings/:key
 */
export const updateSystemSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!ALLOWED_SETTING_KEYS.includes(key)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid setting key' }
            });
        }

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
                message: 'Failed to update system setting'
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

        if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
            return res.status(400).json({
                success: false,
                error: { message: 'Full name must be between 2 and 100 characters' }
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid email address' }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
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
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to send invitation'
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
                    totalActiveUsers
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
                message: 'Failed to fetch engagement stats'
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
        const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 1000);
        const safePage = Math.max(parseInt(page) || 1, 1);
        const offset = (safePage - 1) * safeLimit;

        const ALLOWED_ROLES = ['farmer', 'instructor', 'admin'];
        const whereClause = {};
        if (role && ALLOWED_ROLES.includes(role)) whereClause.role = role;
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
            limit: safeLimit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: { exclude: ['password'] }
        });

        // --- ENRICHMENT LOGIC START ---

        // 0. For admin queries, identify the original super admin (lowest ID) and flag them
        if (role === 'admin') {
            const firstAdmin = await User.findOne({
                where: { role: 'admin' },
                order: [['id', 'ASC']],
                attributes: ['id']
            });
            if (firstAdmin) {
                rows.forEach(user => {
                    user.dataValues.is_super_admin = user.id === firstAdmin.id;
                });
            }
        }

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

        // 2. Fetch all farmers' locations to compute per-instructor farmer counts
        const allFarmerDetails = await FarmerDetail.findAll({
            attributes: ['locations'],
            raw: true
        });

        const divisionToCount = {};
        allFarmerDetails.forEach(fd => {
            let locs = fd.locations;
            if (typeof locs === 'string') { try { locs = JSON.parse(locs); } catch { locs = []; } }
            if (!Array.isArray(locs)) locs = [];
            locs.forEach(loc => {
                const div = loc?.instructorDivision || loc?.instructor_division || loc?.division;
                if (div) {
                    divisionToCount[div] = (divisionToCount[div] || 0) + 1;
                }
            });
        });

        // 3. Attach computed data to rows
        rows.forEach(user => {
            if (user.role === 'farmer') {
                // Find instructor from farmer's first location division
                let primaryDivision = null;
                const locs = user.farmerDetail?.locations;
                if (Array.isArray(locs) && locs.length > 0) {
                    const firstLoc = locs[0] || {};
                    primaryDivision = firstLoc.instructorDivision || firstLoc.instructor_division || firstLoc.division;
                }
                user.dataValues.instructor = primaryDivision ? (divisionToInstructor[primaryDivision] || 'Not Assigned') : 'Not Assigned';
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
                page: safePage,
                limit: safeLimit,
                total: count,
                totalPages: Math.ceil(count / safeLimit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch users'
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
                message: 'Failed to update user status'
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

        // Prevent deleting the original super admin (first admin by lowest ID)
        if (user.role === 'admin') {
            const firstAdmin = await User.findOne({
                where: { role: 'admin' },
                order: [['id', 'ASC']],
                attributes: ['id']
            });
            if (firstAdmin && firstAdmin.id === user.id) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'The original super admin account cannot be deleted' }
                });
            }
            // Allow deletion of other (invited) admin accounts
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
                message: 'Failed to delete user'
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

        const allRatings = await InstructorRating.findAll();
        const ratingsByInstructor = {};
        allRatings.forEach(r => {
            if (!ratingsByInstructor[r.instructor_id]) ratingsByInstructor[r.instructor_id] = [];
            ratingsByInstructor[r.instructor_id].push(r);
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
                let locs = fDetails.locations;
                if (typeof locs === 'string') { try { locs = JSON.parse(locs); } catch { locs = []; } }
                if (!Array.isArray(locs)) locs = [];
                return locs.some(loc => {
                    const div = loc?.instructorDivision || loc?.instructor_division || loc?.division;
                    return div && divisions.includes(div);
                });
            });

            return {
                id: inst.id,
                displayId: details.instructor_id || `INST-${inst.id}`,
                name: inst.full_name,
                nic: inst.nic || '-',
                phone: inst.phone,
                district: details.district || 'Anuradhapura',
                zone: details.zone || '-',
                divisions: divisions,
                avatar: inst.profile_picture || null,
                averageRating: parseFloat(details.average_rating) || 0,
                farmersCount: myFarmers.length,
                farmers: myFarmers.map(f => {
                    const fDetails = f.farmerDetail || {};
                    let farmerLocations = [];
                    try {
                        farmerLocations = Array.isArray(fDetails.locations)
                            ? fDetails.locations
                            : (typeof fDetails.locations === 'string' ? JSON.parse(fDetails.locations || '[]') : []);
                    } catch { farmerLocations = []; }
                    const primaryLoc = farmerLocations[0] || {};
                    return {
                        id: fDetails.farmer_id || `FARM-${f.id}`,
                        name: f.full_name,
                        nic: f.nic || '-',
                        phone: f.phone,
                        district: fDetails.district || primaryLoc.district || 'Anuradhapura',
                        zone: primaryLoc.zone || '-',
                        instructorDivision: primaryLoc.division || primaryLoc.instructorDivision || primaryLoc.instructor_division || '-',
                        farmerLocations,
                        avatar: f.profile_picture || null
                    };
                }),
                reviews: (ratingsByInstructor[details.instructor_id] || []).map(r => ({
                    id: r.id,
                    farmer: r.farmer_name || 'Unknown',
                    rating: r.rating,
                    comment: r.comments || ''
                }))
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
                message: 'Failed to fetch instructor engagement'
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
                message: 'Failed to generate IDs'
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
                message: 'Failed to fetch IDs'
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
                message: 'Failed to update status'
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
                message: 'Failed to delete IDs'
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
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        { model: FarmerDetail, as: 'farmerDetail', required: false, attributes: ['farmer_id'] },
                        { model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] }
                    ]
                },
                {
                    model: User,
                    as: 'recipient',
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        { model: FarmerDetail, as: 'farmerDetail', required: false, attributes: ['farmer_id'] },
                        { model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Helper to get the generated display ID for a user
        const getDisplayId = (user) => {
            if (!user) return null;
            if (user.role === 'farmer' && user.farmerDetail?.farmer_id) return user.farmerDetail.farmer_id;
            if (user.role === 'instructor' && user.instructorDetail?.instructor_id) return user.instructorDetail.instructor_id;
            return null;
        };

        const formattedMessages = messages.map(msg => {
            // Helper function to get display name only (no embedded ID)
            const formatCustomId = (user) => {
                if (!user) return 'Unknown User';
                if (user.role === 'admin') return 'Admin';
                const fullName = user.full_name?.trim() || 'Unknown User';
                if (!fullName || fullName === 'null' || fullName === 'undefined') return 'Unknown User';
                return fullName;
            };
            
            // Helper function to format recipient name
            const formatRecipientName = (msg) => {
                if (msg.recipient_type === 'all') return 'All Users';
                if (msg.recipient_type === 'admin') return 'All Admins';
                if (msg.recipient_type === 'farmers') return 'All Farmers';
                if (msg.recipient_type === 'instructors') return 'All Instructors';
                if (!msg.recipient) return 'Unknown Recipient';
                return formatCustomId(msg.recipient);
            };
            
            // Get formatted sender and recipient names
            const senderName = formatCustomId(msg.sender);
            const recipientName = formatRecipientName(msg);
            
            const messageType = msg.sender_id === userId ? 'sent' : 'received';

            return {
                id: msg.id,
                subject: msg.subject,
                content: msg.content,
                sender: senderName,
                senderId: msg.sender_id,
                senderDisplayId: getDisplayId(msg.sender),
                recipient: recipientName,
                recipientId: msg.recipient_id,
                recipientDisplayId: msg.recipient ? getDisplayId(msg.recipient) : null,
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

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const io = req.app.get('io'); // Get Socket.IO instance

        const message = await Message.findOne({
            where: {
                id,
                [Op.or]: [
                    { sender_id: userId },  // User can delete their own sent messages
                    { recipient_id: userId },  // User can delete messages they received
                    { recipient_type: 'all' },  // Broadcast messages
                    { recipient_type: 'admin' }  // Admin broadcast messages
                ]
            }
        });

        if (!message) {
            return res.status(404).json({ success: false, error: { message: 'Message not found' } });
        }

        await message.destroy();

        // Emit WebSocket event for real-time update
        if (io) {
            io.emit('messageDeleted', { messageId: id, deletedBy: userId });
        }

        return res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to delete message' } });
    }
};
export const getAdminReportHistory = async (req, res) => { try { const history = await ReportHistory.findAll({ where: { user_id: req.user.id, role: 'admin' }, order: [['created_at', 'DESC']] }); res.json({ success: true, data: history }); } catch (error) { res.status(500).json({ success: false, error: { message: error.message } }); } };
export const addAdminReportHistory = async (req, res) => { try { const { category, report_name, status } = req.body; const newHistory = await ReportHistory.create({ user_id: req.user.id, role: 'admin', category, report_name, status: status || 'Success' }); res.status(201).json({ success: true, data: newHistory }); } catch (error) { res.status(500).json({ success: false, error: { message: error.message } }); } };
