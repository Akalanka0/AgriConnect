import {
    User,
    InstructorDetail,
    FarmerDetail,
    PestReport,
    CropPlan,
    Meeting,
    Activity,
    Message,
    SystemSetting,
    Crop // Ensure Crop is explicitly imported
} from '../../models/index.js';
import { Sequelize, Op } from 'sequelize';

/**
 * Get Instructor Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });

        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const divisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        // Assigned Farmers Count
        const assignedFarmersCount = await FarmerDetail.count({
            where: {
                [Op.or]: divisions.map(div => ({
                    instructor_division: {
                        [Op.like]: `%${div}%`
                    }
                }))
            }
        });

        // Pending Crop Plans
        const pendingCropPlansCount = await CropPlan.count({
            where: {
                [Op.or]: [
                    { instructor_id: userId },
                    { 
                        [Op.or]: divisions.map(div => ({
                            instructor_division: {
                                [Op.like]: `%${div}%`
                            }
                        }))
                    }
                ],
                status: { [Op.in]: ['pending', 'correction'] }
            }
        });

        // Pending Pest Reports
        const pendingPestReportsCount = await PestReport.count({
            where: {
                [Op.or]: [
                    { instructor_id: userId },
                    { 
                        [Op.or]: divisions.map(div => ({
                            instructor_division: {
                                [Op.like]: `%${div}%`
                            }
                        }))
                    }
                ],
                status: { [Op.in]: ['pending', 'in_progress'] }
            }
        });

        // Unread Messages Count
        const unreadMessagesCount = await Message.count({
            where: {
                recipient_id: userId,
                is_read: false
            }
        });

        // Upcoming Meetings Count (Accepted or Pending)
        const upcomingMeetingsCount = await Meeting.count({
            where: {
                instructor_id: userId,
                status: { [Op.in]: ['accepted', 'pending'] },
                meetingDate: { [Op.gte]: new Date().toISOString().split('T')[0] }
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                assignedFarmers: assignedFarmersCount,
                pendingTasks: {
                    crop: pendingCropPlansCount,
                    pest: pendingPestReportsCount
                },
                upcomingMeetings: upcomingMeetingsCount,
                averageRating: instructor.average_rating || 0.0,
                unreadMessages: unreadMessagesCount
            }
        });
    } catch (error) {
        console.error('Error fetching instructor dashboard stats:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch dashboard stats' } });
    }
};

/**
 * Message Management
 */
export const getMyMessages = async (req, res) => {
    try {
        const userId = req.user.id;

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
            if (msg.recipient_type === 'instructors') {
                return 'All Instructors';
            }
            if (!msg.recipient) {
                console.warn('⚠️ formatRecipientName: msg.recipient is null or undefined');
                return 'Unknown Recipient';
            }
            return formatCustomId(msg.recipient);
        };

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { recipient_id: userId },
                    { recipient_type: 'all' },
                    { recipient_type: 'instructors' },
                    { recipient_type: 'select' },
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

        // Format for frontend
        const formattedMessages = messages.map(msg => {
            // Determine message type
            let messageType;
            if (msg.sender_id === userId) {
                messageType = 'sent';
            } else if (msg.recipient_type === 'select' && msg.recipient_id === userId) {
                messageType = 'received'; // Messages sent specifically TO this instructor
            } else if (msg.recipient_type === 'all' || msg.recipient_type === 'instructors') {
                messageType = 'received'; // Broadcast messages
            } else {
                messageType = 'received'; // Other received messages
            }
            
            // Get formatted sender and recipient names with custom IDs
            const senderName = formatCustomId(msg.sender);
            const recipientName = formatRecipientName(msg);
            
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
        console.error('Error fetching messages:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch messages' } });
    }
};

export const sendMessage = async (req, res) => {
    try {
        console.log('📩 [Instructor] Sending Message - Body:', req.body);
        console.log('📎 [Instructor] Sending Message - File:', req.file);
        const userId = req.user.id;
        let { subject, content, recipient_type, recipient_id, recipient_ids } = req.body;

        // Handle file upload from middleware
        let attachment_url = req.body.attachment_url;
        let attachment_name = req.body.attachment_name;
        let attachment_public_id = req.body.attachment_public_id;

        if (req.file) {
            attachment_url = req.file.path;
            attachment_name = req.file.originalname;
            attachment_public_id = req.file.public_id;
        }

        // Parse recipient_ids if provided as string (e.g. from FormData)
        if (typeof recipient_ids === 'string') {
            try {
                recipient_ids = JSON.parse(recipient_ids);
            } catch (e) {
                recipient_ids = [recipient_id];
            }
        }

        if (recipient_type === 'select' && Array.isArray(recipient_ids)) {
            const messagesData = recipient_ids.map(id => ({
                sender_id: userId,
                recipient_id: id,
                recipient_type: 'select',
                subject,
                content,
                attachment_url,
                attachment_name,
                attachment_public_id
            }));
            await Message.bulkCreate(messagesData);
            return res.status(201).json({ success: true, message: 'Messages sent successfully' });
        } else {
            const message = await Message.create({
                sender_id: userId,
                recipient_id,
                recipient_type: recipient_type || 'select',
                subject,
                content,
                attachment_url,
                attachment_name,
                attachment_public_id
            });
            return res.status(201).json({ success: true, message: 'Message sent successfully', data: message });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to send message' } });
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
                    { recipient_type: 'instructors' }  // Broadcast to instructors
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

/**
 * Get Instructor Recent History
 */
/**
 * Get Instructor Dashboard History
 */
export const getRecentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch recent activities related to this instructor
        const [meetings, cropPlans, pestReports] = await Promise.all([
            Meeting.findAll({
                where: { instructor_id: userId },
                limit: 5,
                order: [['updated_at', 'DESC']],
                include: [{ model: User, as: 'farmer', attributes: ['full_name'] }]
            }),
            CropPlan.findAll({
                where: { instructor_id: userId },
                limit: 5,
                order: [['updated_at', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['full_name'] }]
            }),
            PestReport.findAll({
                where: { instructor_id: userId },
                limit: 5,
                order: [['updated_at', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['full_name'] }]
            })
        ]);

        const history = [];

        meetings.forEach(m => {
            history.push({
                action: `Meeting with ${m.farmer?.full_name || 'Farmer'} updated to ${m.status}`,
                date: m.updated_at.toISOString().split('T')[0],
                timestamp: m.updated_at
            });
        });

        cropPlans.forEach(cp => {
            history.push({
                action: `Crop plan for ${cp.user?.full_name || 'Farmer'} updated to ${cp.status}`,
                date: cp.updated_at.toISOString().split('T')[0],
                timestamp: cp.updated_at
            });
        });

        pestReports.forEach(pr => {
            history.push({
                action: `Pest report from ${pr.user?.full_name || 'Farmer'} updated to ${pr.status}`,
                date: pr.updated_at.toISOString().split('T')[0],
                timestamp: pr.updated_at
            });
        });

        // Sort by timestamp and take the top 5
        const sortedHistory = history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
            .map(item => ({
                action: item.action,
                date: item.date
            }));

        return res.status(200).json({
            success: true,
            data: sortedHistory
        });
    } catch (error) {
        console.error('Error fetching dashboard history:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch dashboard history' } });
    }
};

/**
 * Get Assigned Farmers
 */
export const getAssignedFarmers = async (req, res) => {
    try {
        const userId = req.user.id;
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });

        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        let divisions = [];
        try {
            divisions = Array.isArray(instructor.assigned_divisions)
                ? instructor.assigned_divisions
                : (typeof instructor.assigned_divisions === 'string'
                    ? JSON.parse(instructor.assigned_divisions || '[]')
                    : []);
        } catch (e) {
            console.error('Error parsing assigned_divisions:', e);
            divisions = [];
        }

        // If no divisions assigned, return empty list immediately
        if (!divisions || divisions.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const farmers = await User.findAll({
            where: { role: 'farmer' },
            include: [{
                model: FarmerDetail,
                as: 'farmerDetail',
                where: {
                    [Op.or]: [
                        // Match primary division
                        ...divisions.map(div => ({
                            instructor_division: {
                                [Op.like]: `%${div}%`
                            }
                        })),
                        // Match inside locations JSON
                        ...divisions.map(div => (
                            Sequelize.where(
                                Sequelize.cast(Sequelize.col('farmerDetail.locations'), 'CHAR'),
                                { [Op.like]: `%${div}%` }
                            )
                        ))
                    ]
                }
            }],
            attributes: ['id', 'full_name', 'email', 'phone', 'nic', 'created_at']
        });

        const formattedFarmers = farmers.map(f => {
            // Find the matching division for display
            let displayDivision = f.farmerDetail?.instructor_division;
            
            // If primary division doesn't match or is missing, check locations
            // We check if the current displayDivision is one of the assigned divisions
            // If not, we try to find a matching one from locations
            const isPrimaryMatch = displayDivision && divisions.some(d => displayDivision.includes(d));
            
            if (!isPrimaryMatch && f.farmerDetail?.locations) {
                let locations = [];
                try {
                    locations = Array.isArray(f.farmerDetail.locations) 
                        ? f.farmerDetail.locations 
                        : JSON.parse(f.farmerDetail.locations || '[]');
                } catch (e) {
                    locations = [];
                }

                const matchingLoc = locations.find(loc => 
                    divisions.some(div => {
                        const locDiv = loc.instructorDivision || loc.division;
                        return locDiv && locDiv.includes(div);
                    })
                );
                
                if (matchingLoc) {
                    displayDivision = matchingLoc.instructorDivision || matchingLoc.division;
                }
            }

            return {
                id: f.id,
                displayId: f.farmerDetail?.farmer_id || `FARM-${f.id}`,
                name: f.full_name,
                email: f.email,
                phone: f.phone,
                nic: f.nic,
                district: f.farmerDetail?.district || 'N/A',
                zone: f.farmerDetail?.zone || 'N/A',
                division: displayDivision || 'N/A',
                joined: f.created_at ? f.created_at.toISOString().split('T')[0] : 'N/A'
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedFarmers
        });
    } catch (error) {
        console.error('Error fetching assigned farmers:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch assigned farmers' } });
    }
};

/**
 * Get Specific Farmer Details
 */
export const getFarmerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const farmer = await User.findOne({
            where: { id, role: 'farmer' },
            include: [{
                model: FarmerDetail,
                as: 'farmerDetail'
            }],
            attributes: ['id', 'full_name', 'email', 'phone', 'nic', 'created_at', 'profile_picture']
        });

        if (!farmer) {
            return res.status(404).json({ success: false, error: { message: 'Farmer not found' } });
        }

        // Parse locations if string
        let locations = [];
        try {
            const locData = farmer.farmerDetail?.locations;
            locations = typeof locData === 'string' ? JSON.parse(locData) : (locData || []);
        } catch (e) {
            locations = [];
        }

        const formattedFarmer = {
            id: farmer.id,
            displayId: farmer.farmerDetail?.farmer_id || `FARM-${farmer.id}`,
            name: farmer.full_name,
            email: farmer.email,
            phone: farmer.phone,
            nic: farmer.nic,
            district: farmer.farmerDetail?.district || 'N/A',
            zone: farmer.farmerDetail?.zone || 'N/A',
            primaryDivision: farmer.farmerDetail?.instructor_division || 'N/A',
            locations: locations,
            joined: farmer.created_at,
            profilePicture: farmer.profile_picture
        };

        return res.status(200).json({
            success: true,
            data: formattedFarmer
        });
    } catch (error) {
        console.error('Error fetching farmer details:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch farmer details' } });
    }
};

/**
 * Get Pest Reports for Instructor
 */
export const getPestReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });

        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const divisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        console.log('🔍 [getPestReports] Instructor Divisions:', divisions);
        console.log('🔍 [getPestReports] Instructor ID:', userId);

        const reports = await PestReport.findAll({
            where: {
                [Op.or]: [
                    // Match by explicit instructor assignment
                    { instructor_id: userId },
                    // Match by unassigned division-based items
                    { 
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    instructor_division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }
                        ]
                    }
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name'],
                include: [{
                    model: FarmerDetail,
                    as: 'farmerDetail',
                    attributes: ['farmer_id', 'district', 'zone']
                }]
            }],
            order: [['created_at', 'DESC']]
        });

        console.log(`🔍 [getPestReports] Found ${reports.length} reports`);

        const formattedReports = reports.map(r => ({
            id: r.id,
            farmerName: r.user?.full_name || 'N/A',
            farmerId: r.user?.farmerDetail?.farmer_id || 'N/A',
            location: `${r.user?.farmerDetail?.district || ''} - ${r.user?.farmerDetail?.zone || ''}`,
            reportedDate: r.created_at.toISOString().split('T')[0],
            pestName: r.name,
            pestType: r.type,
            pestCrop: r.crop,
            pestSeverity: r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
            pestNotes: r.notes,
            resolution: r.resolution,
            status: r.status === 'pending' ? 'Pending' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
            farmerFiles: r.farmer_attachments || [],
            attachments: r.instructor_attachments || [] // Use new field
        }));

        return res.status(200).json({ success: true, data: formattedReports });
    } catch (error) {
        console.error('Error fetching pest reports:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch pest reports' } });
    }
};

/**
 * Update Pest Report Status
 */
export const updatePestReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;
        const userId = req.user.id;

        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });
        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const divisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        const report = await PestReport.findOne({
            where: {
                id,
                [Op.or]: [
                    { instructor_id: userId },
                    { 
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    instructor_division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }
                        ]
                    }
                ]
            }
        });

        if (!report) {
            return res.status(404).json({ success: false, error: { message: 'Report not found or not assigned to you' } });
        }

        // If it was unassigned, assign it to this instructor now
        if (report.instructor_id === null) {
            report.instructor_id = userId;
        }

        // Handle attachment if uploaded
        let attachments = report.instructor_attachments || [];
        if (req.file && req.file.path) {
            attachments.push(req.file.path);
        }

        report.status = status;
        if (resolution) report.resolution = resolution;
        report.instructor_attachments = attachments;
        
        await report.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Report status updated successfully',
            data: report 
        });
    } catch (error) {
        console.error('Error updating pest report status:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update report status' } });
    }
};

/**
 * Get Crop Plans for Instructor
 */
export const getCropPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });

        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const divisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        const plans = await CropPlan.findAll({
            where: {
                [Op.or]: [
                    { instructor_id: userId },
                    { 
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    instructor_division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }
                        ]
                    }
                ]
            },
            include: [{ model: User, as: 'user', attributes: ['full_name'], include: [{ model: FarmerDetail, as: 'farmerDetail', attributes: ['farmer_id', 'district', 'zone'] }] }],
            order: [['created_at', 'DESC']]
        });

        const formattedPlans = plans.map(p => ({
            id: p.id,
            farmerName: p.user?.full_name || 'N/A',
            farmerId: p.user?.farmerDetail?.farmer_id || 'N/A',
            location: `${p.user?.farmerDetail?.district || ''} - ${p.user?.farmerDetail?.zone || ''}`,
            submittedDate: p.created_at.toISOString().split('T')[0],
            cropName: p.crop_name,
            plantDate: p.plant_date,
            harvestDate: p.harvest_date,
            cropNotes: p.notes,
            status: p.status === 'pending' ? 'Pending Review' : (p.status.charAt(0).toUpperCase() + p.status.slice(1)),
            instructorFeedback: p.instructor_feedback,
            reviewedDate: p.reviewed_at ? p.reviewed_at.toISOString().split('T')[0] : (p.status !== 'pending' ? p.updated_at.toISOString().split('T')[0] : 'N/A'),
            farmerFiles: p.farmer_attachments || [],
            attachments: p.instructor_attachments || []
        }));

        return res.status(200).json({ success: true, data: formattedPlans });
    } catch (error) {
        console.error('Error fetching crop plans:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch crop plans' } });
    }
};

/**
 * Update Crop Plan Status
 */
export const updateCropPlanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;
        const userId = req.user.id;

        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });
        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const divisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        const plan = await CropPlan.findOne({
            where: {
                id,
                [Op.or]: [
                    { instructor_id: userId },
                    { 
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    instructor_division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }
                        ]
                    }
                ]
            }
        });

        if (!plan) {
            return res.status(404).json({ success: false, error: { message: 'Plan not found or not assigned to you' } });
        }

        // If it was unassigned, assign it to this instructor now
        if (plan.instructor_id === null) {
            plan.instructor_id = userId;
        }

        plan.status = status;
        if (feedback) plan.instructor_feedback = feedback;

        // Handle attachment if uploaded
        if (req.file && req.file.path) {
            const currentAttachments = Array.isArray(plan.instructor_attachments) ? plan.instructor_attachments : [];
            plan.instructor_attachments = [...currentAttachments, req.file.path];
        }

        plan.reviewed_at = new Date();
        await plan.save();

        return res.status(200).json({ success: true, message: `Plan ${status} successfully` });
    } catch (error) {
        console.error('Error updating crop plan:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update plan' } });
    }
};

/**
 * Get Instructor Profile
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            include: [{ model: InstructorDetail, as: 'instructorDetail' }],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        const userData = user.get({ plain: true });

        if (userData.profile_picture && typeof userData.profile_picture === 'string') {
            userData.profile_picture = userData.profile_picture.replace(/\\/g, '/');
        }

        // Extremely robust zone and divisions handling for frontend stability
        // Fetch valid zones from SystemSetting
        const setting = await SystemSetting.findOne({
            where: { setting_key: 'region_hierarchy' }
        });
        
        let validZones = ['Nuwaragam Palatha', 'Kekirawa', 'Huruluwewa', 'Thambuttegama', 'Rajanganaya', 'Medawachchiya']; // Default fallback
        if (setting) {
            try {
                const hierarchy = JSON.parse(setting.setting_value);
                validZones = Object.keys(hierarchy);
            } catch (e) {
                console.error('Error parsing hierarchy for valid zones:', e);
            }
        }

        if (!userData.instructorDetail) {
            // Create a default instructorDetail object if it's missing
            userData.instructorDetail = {
                district: 'Anuradhapura',
                zone: validZones[0],
                assigned_divisions: [],
                specialization: '',
                experience: 0,
                qualifications: ''
            };
        } else {
            let currentZone = userData.instructorDetail.zone || '';

            // Normalize zone name
            currentZone = currentZone.replace(/\s+Zone\s*$/i, '').trim();

            // Fallback to a valid zone if current one is invalid
            if (!validZones.includes(currentZone)) {
                console.log(`Invalid zone detected: "${currentZone}". Falling back to "${validZones[0]}"`);
                userData.instructorDetail.zone = validZones[0];
            } else {
                userData.instructorDetail.zone = currentZone;
            }

            // Ensure assigned_divisions is an array
            if (!Array.isArray(userData.instructorDetail.assigned_divisions)) {
                try {
                    if (typeof userData.instructorDetail.assigned_divisions === 'string' && userData.instructorDetail.assigned_divisions.trim()) {
                        userData.instructorDetail.assigned_divisions = JSON.parse(userData.instructorDetail.assigned_divisions);
                    } else {
                        userData.instructorDetail.assigned_divisions = [];
                    }
                } catch (e) {
                    userData.instructorDetail.assigned_divisions = [];
                }
            }
        }

        // Get all other instructors in the same zone to find taken divisions
        const otherInstructors = await InstructorDetail.findAll({
            where: {
                zone: userData.instructorDetail.zone,
                user_id: { [Op.ne]: userId }
            },
            attributes: ['assigned_divisions']
        });

        const takenDivisions = [];
        otherInstructors.forEach(inst => {
            const divs = Array.isArray(inst.assigned_divisions)
                ? inst.assigned_divisions
                : (typeof inst.assigned_divisions === 'string'
                    ? JSON.parse(inst.assigned_divisions || '[]')
                    : []);
            takenDivisions.push(...divs);
        });

        userData.instructorDetail.takenDivisions = [...new Set(takenDivisions)];

        return res.status(200).json({ success: true, data: userData });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
    }
};

/**
 * Get Taken Divisions for a Zone
 */
export const getTakenDivisions = async (req, res) => {
    try {
        const { zone } = req.query;
        const userId = req.user.id;

        if (!zone) {
            return res.status(400).json({ success: false, error: { message: 'Zone is required' } });
        }

        const instructors = await InstructorDetail.findAll({
            where: {
                zone: zone,
                user_id: { [Op.ne]: userId }
            },
            attributes: ['assigned_divisions']
        });

        const takenDivisions = [];
        instructors.forEach(inst => {
            const divs = Array.isArray(inst.assigned_divisions)
                ? inst.assigned_divisions
                : (typeof inst.assigned_divisions === 'string'
                    ? JSON.parse(inst.assigned_divisions || '[]')
                    : []);
            takenDivisions.push(...divs);
        });

        return res.status(200).json({ 
            success: true, 
            data: [...new Set(takenDivisions)] 
        });
    } catch (error) {
        console.error('Error fetching taken divisions:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch taken divisions' } });
    }
};

/**
 * Get Region Hierarchy (Zones and Divisions)
 */
export const getRegionHierarchy = async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({
            where: { setting_key: 'region_hierarchy' }
        });

        if (!setting) {
            // Fallback if not in DB yet
            const defaultHierarchy = {
                    'Nuwaragam Palatha': [
                        'Nuwaragam Palatha Central',
                        'Nuwaragam Palatha East',
                        'Mihintale',
                        'Mahavilachchiya',
                        'Tantirimale',
                        'Nochchiyagama'
                    ],
                    'Kekirawa': [
                        'Kekirawa',
                        'Ipalogama',
                        'Palagala',
                        'Thirappane',
                        'Maradankadawala',
                        'Galnewa'
                    ],
                    'Huruluwewa': [
                        'Galenbindunuwewa',
                        'Kahatagasdigiliya',
                        'Horowpothana',
                        'Kebithigollewa',
                        'Padaviya',
                        'Rambewa'
                    ],
                    'Thambuttegama': [
                        'Thambuttegama Town',
                        'Talawa',
                        'Meegalewa',
                        'Eppawala'
                    ],
                    'Rajanganaya': [
                        'Rajanganaya Left Bank',
                        'Rajanganaya Right Bank',
                        'Angamuwa'
                    ],
                    'Medawachchiya': [
                        'Medawachchiya Town',
                        'Punewa',
                        'Ethakada'
                    ]
                };
            return res.status(200).json({ success: true, data: defaultHierarchy });
        }

        return res.status(200).json({ 
            success: true, 
            data: JSON.parse(setting.setting_value) 
        });
    } catch (error) {
        console.error('Error fetching region hierarchy:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch region hierarchy' } });
    }
};

/**
 * Update Instructor Profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, email, phone, district, zone, assigned_divisions, specialization, experience, qualifications } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        user.full_name = full_name !== undefined ? full_name : user.full_name;
        user.email = email !== undefined ? email : user.email;
        user.phone = phone !== undefined ? phone : user.phone;
        await user.save();

        let detail = await InstructorDetail.findOne({ where: { user_id: userId } });
        if (detail) {
            detail.district = district !== undefined ? district : detail.district;
            detail.zone = zone !== undefined ? zone : detail.zone;
            detail.specialization = specialization !== undefined ? specialization : detail.specialization;
            detail.experience = experience !== undefined ? parseInt(experience, 10) || 0 : detail.experience;
            detail.qualifications = qualifications !== undefined ? qualifications : detail.qualifications;

            if (assigned_divisions !== undefined) {
                const requestedDivisions = Array.isArray(assigned_divisions) ? assigned_divisions : (assigned_divisions ? JSON.parse(assigned_divisions) : []);
                
                // Check if any requested division is already taken by another instructor in the same zone
                const otherInstructors = await InstructorDetail.findAll({
                    where: {
                        zone: zone !== undefined ? zone : (detail ? detail.zone : ''),
                        user_id: { [Op.ne]: userId }
                    },
                    attributes: ['assigned_divisions', 'instructor_id']
                });

                const takenDivisions = [];
                otherInstructors.forEach(inst => {
                    const divs = Array.isArray(inst.assigned_divisions)
                        ? inst.assigned_divisions
                        : (typeof inst.assigned_divisions === 'string'
                            ? JSON.parse(inst.assigned_divisions || '[]')
                            : []);
                    takenDivisions.push(...divs);
                });

                const alreadyTaken = requestedDivisions.filter(d => takenDivisions.includes(d));
                if (alreadyTaken.length > 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: { message: `Divisions already assigned to another instructor: ${alreadyTaken.join(', ')}` } 
                    });
                }

                detail.assigned_divisions = requestedDivisions;
            }
            await detail.save();
        } else {
            // Generate an instructor ID if it doesn't exist
            const instructorId = `INST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await InstructorDetail.create({
                user_id: userId,
                instructor_id: instructorId,
                district,
                zone,
                specialization,
                experience: parseInt(experience, 10) || 0,
                qualifications,
                assigned_divisions: Array.isArray(assigned_divisions) ? assigned_divisions : (assigned_divisions ? JSON.parse(assigned_divisions) : [])
            });
        }
        return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
    }
};

/**
 * Get Instructor Ratings
 */
export const getInstructorRatings = async (req, res) => {
    try {
        const instructorId = req.user.instructorDetail?.instructor_id;

        if (!instructorId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Instructor profile not found' } 
            });
        }

        // Import InstructorRating model to avoid circular dependencies
        const { InstructorRating } = await import('../models/index.js');

        // Get ratings with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: ratings } = await InstructorRating.findAndCountAll({
            where: { 
                instructor_id: instructorId,
                status: 'approved'
            },
            include: [
                {
                    model: await import('../models/FarmerDetail.js').then(m => m.default),
                    as: 'farmer',
                    attributes: ['farmer_id', 'district', 'zone']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Calculate statistics
        const averageRating = count > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
            : 0;

        // Group ratings by star count
        const ratingDistribution = {
            5: ratings.filter(r => r.rating === 5).length,
            4: ratings.filter(r => r.rating === 4).length,
            3: ratings.filter(r => r.rating === 3).length,
            2: ratings.filter(r => r.rating === 2).length,
            1: ratings.filter(r => r.rating === 1).length
        };

        res.status(200).json({
            success: true,
            data: {
                instructor_id: instructorId,
                total_ratings: count,
                average_rating: parseFloat(averageRating.toFixed(1)),
                rating_distribution: ratingDistribution,
                current_page: page,
                total_pages: Math.ceil(count / limit),
                ratings: ratings.map(rating => ({
                    id: rating.id,
                    farmer_name: rating.farmer_name || 'Anonymous Farmer',
                    farmer_id: rating.farmer_id,
                    farmer_district: rating.farmer?.district,
                    farmer_zone: rating.farmer?.zone,
                    rating: rating.rating,
                    comments: rating.comments,
                    created_at: rating.created_at
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching instructor ratings:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to fetch ratings' } 
        });
    }
};

/**
 * Update Instructor Profile Picture
 */
export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        user.profile_picture = req.file.path.replace(/\\/g, '/');
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: { profile_picture: user.profile_picture }
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update profile picture' } });
    }
};

/**
 * Remove Instructor Profile Picture
 */
export const removeProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        user.profile_picture = null; // Or empty string based on model definition, null is safer if allowed
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
 * Get Instructor Meetings
 */
export const getMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get instructor's divisions to include division-wide pending meetings
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });
        const divisions = Array.isArray(instructor?.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor?.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        const meetings = await Meeting.findAll({
            where: {
                [Op.or]: [
                    { instructor_id: userId },
                    {
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }, // Effectively return nothing for unassigned if no divisions
                            { status: 'pending' }
                        ]
                    }
                ]
            },
            include: [{
                model: User,
                as: 'farmer',
                attributes: ['full_name'],
                include: [{
                    model: FarmerDetail,
                    as: 'farmerDetail',
                    attributes: ['farmer_id']
                }]
            }],
            order: [['meetingDate', 'DESC']]
        });

        const formattedMeetings = meetings.map(m => ({
            id: m.id,
            meetingTitle: m.meetingTitle,
            meetingDate: m.meetingDate,
            meetingTime: m.meetingTime,
            meetingDuration: m.meetingDuration,
            meetingNotes: m.meetingNotes,
            instructorNote: m.instructorNote,
            status: m.status,
            instructor_id: m.instructor_id,
            farmerName: m.farmer?.full_name || 'N/A',
            farmerId: m.farmer?.farmerDetail?.farmer_id || 'N/A',
            division: m.division || 'N/A',
            requestedBy: m.requestedBy,
            zoomLink: m.zoomLink,
            suggestedDate: m.suggestedDate,
            suggestedTime: m.suggestedTime,
            cancelReason: m.cancelReason
        }));

        return res.status(200).json({ success: true, data: formattedMeetings });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch meetings' } });
    }
};

/**
 * Get All Crop Calendars (Reference)
 */
export const getCropCalendars = async (req, res) => {
    try {
        console.log('--- getCropCalendars Backend Called ---');
        
        // Safety check: is Crop model defined?
        if (!Crop) {
            console.error('CRITICAL: Crop model is UNDEFINED in instructorController');
            return res.status(500).json({ success: false, error: { message: 'Crop model not loaded' } });
        }

        const crops = await Crop.findAll({
            order: [['name', 'ASC']]
        });
        
        console.log(`Backend found ${crops ? crops.length : 0} crops in DB`);
        
        const formattedCrops = (crops || []).map(crop => ({
            id: crop.id,
            name: crop.name,
            image: crop.image_url,
            description: crop.description
        }));

        return res.status(200).json({ success: true, data: formattedCrops });
    } catch (error) {
        console.error('CRITICAL BACKEND ERROR in getCropCalendars:', error);
        return res.status(500).json({ 
            success: false, 
            error: { 
                message: 'Failed to fetch crop calendars from database',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            } 
        });
    }
};

/**
 * Update Crop Calendar Image
 */
export const updateCropCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, error: { message: 'No image file uploaded' } });
        }

        const crop = await Crop.findByPk(id);
        if (!crop) {
            return res.status(404).json({ success: false, error: { message: 'Crop not found' } });
        }

        crop.image_url = req.file.path;
        await crop.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Crop calendar updated successfully',
            data: {
                id: crop.id,
                name: crop.name,
                image: crop.image_url
            }
        });
    } catch (error) {
        console.error('Error updating crop calendar:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update crop calendar' } });
    }
};

/**
 * Remove Crop Calendar Image
 */
export const removeCropCalendarImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const crop = await Crop.findByPk(id);
        if (!crop) {
            return res.status(404).json({ success: false, error: { message: 'Crop not found' } });
        }

        crop.image_url = null;
        crop.image_public_id = null;
        await crop.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Crop calendar image removed successfully'
        });
    } catch (error) {
        console.error('Error removing crop calendar image:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to remove crop calendar image' } });
    }
};

/**
 * Get Instructor Reports Data
 */
export const getReportsData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, startDate, endDate, status, division } = req.query;

        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });
        if (!instructor) {
            return res.status(404).json({ success: false, error: { message: 'Instructor details not found' } });
        }

        const instructorDivisions = Array.isArray(instructor.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        // Filter by division if specified and not 'All', otherwise use all instructor divisions
        const targetDivisions = (division && division !== 'All') ? [division] : instructorDivisions;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter[Op.between] = [new Date(startDate), new Date(endDate)];
        } else if (startDate) {
            dateFilter[Op.gte] = new Date(startDate);
        } else if (endDate) {
            dateFilter[Op.lte] = new Date(endDate);
        }

        let reportData = [];
        let columns = [];

        if (type === 'Pest Management') {
            const where = {
                [Op.or]: targetDivisions.map(div => ({
                    instructor_division: {
                        [Op.like]: `%${div}%`
                    }
                }))
            };
            if (Object.keys(dateFilter).length > 0) where.created_at = dateFilter;
            if (status && status !== 'All') where.status = status.toLowerCase();

            const reports = await PestReport.findAll({
                where,
                include: [{ model: User, as: 'user', attributes: ['full_name'] }],
                order: [['created_at', 'DESC']]
            });

            columns = ['Date', 'Farmer', 'Pest/Disease', 'Type', 'Crop', 'Severity', 'Status', 'Division'];
            reportData = reports.map(r => [
                r.created_at.toISOString().split('T')[0],
                r.user?.full_name || 'N/A',
                r.name,
                r.type,
                r.crop,
                r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
                r.status === 'pending' ? 'Pending' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
                r.instructor_division
            ]);

        } else if (type === 'Crop Plans') {
            const where = {
                [Op.or]: targetDivisions.map(div => ({
                    instructor_division: {
                        [Op.like]: `%${div}%`
                    }
                }))
            };
            if (Object.keys(dateFilter).length > 0) where.created_at = dateFilter;
            if (status && status !== 'All') where.status = status.toLowerCase();

            const plans = await CropPlan.findAll({
                where,
                include: [{ model: User, as: 'user', attributes: ['full_name'] }],
                order: [['created_at', 'DESC']]
            });

            columns = ['Date', 'Farmer', 'Crop', 'Planting Date', 'Harvest Date', 'Status', 'Division'];
            reportData = plans.map(p => [
                p.created_at.toISOString().split('T')[0],
                p.user?.full_name || 'N/A',
                p.crop_name,
                p.plant_date,
                p.harvest_date,
                p.status === 'pending' ? 'Pending Review' : (p.status.charAt(0).toUpperCase() + p.status.slice(1)),
                p.instructor_division
            ]);

        } else if (type === 'Meetings') {
            const where = { instructor_id: userId };
            if (Object.keys(dateFilter).length > 0) where.meetingDate = dateFilter;
            if (status && status !== 'All') where.status = status.toLowerCase();
            if (division && division !== 'All') where.division = division;

            const meetings = await Meeting.findAll({
                where,
                include: [{ model: User, as: 'farmer', attributes: ['full_name'] }],
                order: [['meetingDate', 'DESC']]
            });

            columns = ['Date', 'Time', 'Farmer', 'Purpose', 'Duration', 'Status', 'Division'];
            reportData = meetings.map(m => [
                m.meetingDate,
                m.meetingTime,
                m.farmer?.full_name || 'N/A',
                m.meetingTitle,
                m.meetingDuration + ' mins',
                m.status.charAt(0).toUpperCase() + m.status.slice(1),
                m.division || 'N/A'
            ]);
        } else {
            return res.status(400).json({ success: false, error: { message: 'Invalid report type' } });
        }

        return res.status(200).json({
            success: true,
            data: {
                columns,
                rows: reportData,
                summary: {
                    totalRecords: reportData.length,
                    reportType: type,
                    generatedAt: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Error fetching reports data:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch reports data' } });
    }
};

/**
 * Update Meeting Status
 */
export const updateMeetingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, zoomLink, suggestedDate, suggestedTime, instructorNote, cancelReason } = req.body;
        const userId = req.user.id;

        // Allow updating if it's assigned to them OR if it's unassigned but in their division
        const instructor = await InstructorDetail.findOne({ where: { user_id: userId } });
        const divisions = Array.isArray(instructor?.assigned_divisions)
            ? instructor.assigned_divisions
            : (typeof instructor?.assigned_divisions === 'string'
                ? JSON.parse(instructor.assigned_divisions || '[]')
                : []);

        const meeting = await Meeting.findOne({
            where: {
                id,
                [Op.or]: [
                    { instructor_id: userId },
                    {
                        [Op.and]: [
                            { instructor_id: null },
                            divisions.length > 0 ? {
                                [Op.or]: divisions.map(div => ({
                                    division: { [Op.like]: `%${div}%` }
                                }))
                            } : { id: -1 }
                        ]
                    }
                ]
            }
        });

        if (!meeting) {
            return res.status(404).json({ success: false, error: { message: 'Meeting not found or not assigned to you' } });
        }

        // If it was unassigned, assign it to this instructor now
        if (meeting.instructor_id === null) {
            meeting.instructor_id = userId;
        }

        meeting.status = status;
        if (zoomLink) meeting.zoomLink = zoomLink;
        if (suggestedDate) meeting.suggestedDate = suggestedDate;
        if (suggestedTime) meeting.suggestedTime = suggestedTime;
        if (instructorNote) meeting.instructorNote = instructorNote;
        if (cancelReason) meeting.cancelReason = cancelReason;

        await meeting.save();

        return res.status(200).json({ success: true, message: `Meeting ${status} successfully` });
    } catch (error) {
        console.error('Error updating meeting status:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update meeting status' } });
    }
};

