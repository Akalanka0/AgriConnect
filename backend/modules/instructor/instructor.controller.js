import { sequelize, User, InstructorDetail, FarmerDetail, CropPlan, PestReport, HarvestRecord, Activity, Meeting, Message, Crop, Region } from '../../models/index.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';

// Middleware for handling file uploads in messages
export const uploadMessageAttachment = (req, res, next) => {
    upload.single('attachment')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: { message: 'File upload failed' }
            });
        }
        uploadToCloudinaryMiddleware(req, res, next);
    });
};

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
            where: divisions.length > 0 ? {
                [Op.or]: divisions.map(div =>
                    sequelize.where(
                        sequelize.fn('JSON_SEARCH', sequelize.col('locations'), 'one', div, sequelize.literal('NULL'), sequelize.literal("'$[*].division'")),
                        { [Op.ne]: null }
                    )
                )
            } : { id: -1 }
        });

        // Pending Crop Plans
        const cropPlanOrConditions = [{ instructor_id: userId }];
        if (divisions.length > 0) {
            cropPlanOrConditions.push({
                [Op.or]: divisions.map(div => ({
                    instructor_division: {
                        [Op.like]: `%${div}%`
                    }
                }))
            });
        }

        const pendingCropPlansCount = await CropPlan.count({
            where: {
                [Op.or]: cropPlanOrConditions,
                status: { [Op.in]: ['pending', 'correction'] }
            }
        });

        // Pending Pest Reports
        const pestReportOrConditions = [{ instructor_id: userId }];
        if (divisions.length > 0) {
            pestReportOrConditions.push({
                [Op.or]: divisions.map(div => ({
                    instructor_division: {
                        [Op.like]: `%${div}%`
                    }
                }))
            });
        }

        const pendingPestReportsCount = await PestReport.count({
            where: {
                [Op.or]: pestReportOrConditions,
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
                meeting_date: { [Op.gte]: new Date().toISOString().split('T')[0] }
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

        // Returns generated ID (INST-XXXX or FARM-XXXX), null for admin
        const getDisplayId = (user) => {
            if (!user) return null;
            if (user.role === 'admin') return null;
            if (user.instructorDetail?.instructor_id) return user.instructorDetail.instructor_id;
            if (user.farmerDetail?.farmer_id) return user.farmerDetail.farmer_id;
            return null;
        };

        // Helper function to format display name only
        const formatCustomId = (user) => {
            if (!user) return 'Unknown User';
            if (user.role === 'admin') return 'Admin';
            return user.full_name?.trim() || 'Unknown User';
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
                console.warn('formatRecipientName: msg.recipient is null or undefined');
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
                    { recipient_type: 'select', recipient_id: userId },
                    { sender_id: userId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        { model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] },
                        { model: FarmerDetail, as: 'farmerDetail', required: false, attributes: ['farmer_id'] }
                    ]
                },
                {
                    model: User,
                    as: 'recipient',
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        { model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] },
                        { model: FarmerDetail, as: 'farmerDetail', required: false, attributes: ['farmer_id'] }
                    ]
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
        console.error('Error fetching messages:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch messages' } });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const io = req.app.get('io'); // Get Socket.IO instance
        
        let { subject, content, recipient_type, recipient_id, recipient_ids } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ success: false, error: { message: 'Subject and content are required' } });
        }

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
                attachment_public_id,
                message_type: req.file ? 'file' : 'text'
            }));
            const createdMessages = await Message.bulkCreate(messagesData);
            
            // Emit WebSocket events for each recipient
            if (io) {
                // Look up the instructor's generated ID
                const senderUser = await User.findByPk(userId, {
                    attributes: ['id', 'full_name'],
                    include: [{ model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] }]
                });
                const senderDisplayId = senderUser?.instructorDetail?.instructor_id || null;
                const senderName = senderUser?.full_name || 'Instructor';

                createdMessages.forEach(message => {
                    const messageData = {
                        id: message.id,
                        subject: message.subject,
                        content: message.content,
                        recipient_type: message.recipient_type,
                        recipient_id: message.recipient_id,
                        sender_id: userId,
                        sender: senderName,
                        senderId: userId,
                        senderDisplayId,
                        attachment_url: message.attachment_url,
                        attachment_name: message.attachment_name,
                        type: 'sent',
                        date: new Date().toISOString().split('T')[0],
                        is_read: false
                    };
                    
                    io.to(`user_${message.recipient_id}`).emit('newMessage', messageData);
                    
                    // Also emit to sender as 'sent' message
                    const senderMessageData = {
                        ...messageData,
                        type: 'sent'
                    };
                    io.to(`user_${userId}`).emit('newMessage', senderMessageData);
                });
            }
            
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
                attachment_public_id,
                message_type: req.file ? 'file' : 'text'
            });
            
            // Emit WebSocket event
            if (io) {
                // Look up the instructor's generated ID
                const senderUser = await User.findByPk(userId, {
                    attributes: ['id', 'full_name'],
                    include: [{ model: InstructorDetail, as: 'instructorDetail', required: false, attributes: ['instructor_id'] }]
                });
                const senderDisplayId = senderUser?.instructorDetail?.instructor_id || null;
                const senderName = senderUser?.full_name || 'Instructor';

                const messageData = {
                    id: message.id,
                    subject: message.subject,
                    content: message.content,
                    recipient_type: message.recipient_type,
                    recipient_id: message.recipient_id,
                    sender_id: userId,
                    sender: senderName,
                    senderId: userId,
                    senderDisplayId,
                    attachment_url: message.attachment_url,
                    attachment_name: message.attachment_name,
                    type: 'received',
                    date: new Date().toISOString().split('T')[0],
                    is_read: false
                };
                
                const senderMessageData = {
                    ...messageData,
                    type: 'sent'
                };
                
                if (recipient_type === 'all') {
                    io.emit('newMessage', messageData);
                } else if (recipient_type === 'admin') {
                    io.to('admin').emit('newMessage', messageData);
                    io.to(`user_${userId}`).emit('newMessage', senderMessageData);
                } else if (recipient_type === 'farmers') {
                    io.to('farmer').emit('newMessage', messageData);
                    io.to(`user_${userId}`).emit('newMessage', senderMessageData);
                } else if (recipient_id) {
                    io.to(`user_${recipient_id}`).emit('newMessage', messageData);
                    io.to(`user_${userId}`).emit('newMessage', senderMessageData);
                }
            }
            
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
                    { recipient_type: 'instructors' }  // Instructor broadcast messages
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
                where: divisions.length > 0 ? {
                    [Op.or]: divisions.map(div =>
                        sequelize.where(
                            sequelize.literal(`JSON_SEARCH(\`farmerDetail\`.\`locations\`, 'one', ${sequelize.escape(div)}, NULL, '$[*].division')`),
                            { [Op.ne]: null }
                        )
                    )
                } : { id: -1 }
            }],
            attributes: ['id', 'full_name', 'email', 'phone', 'nic', 'created_at']
        });

        const formattedFarmers = farmers.map(f => {
            let locs = [];
            try {
                locs = Array.isArray(f.farmerDetail?.locations)
                    ? f.farmerDetail.locations
                    : JSON.parse(f.farmerDetail?.locations || '[]');
            } catch (e) { locs = []; }

            const matchingLoc  = locs.find(loc => divisions.some(d => loc.division === d));
            const displayZone     = matchingLoc?.zone     || locs[0]?.zone     || 'N/A';
            const displayDivision = matchingLoc?.division || locs[0]?.division || 'N/A';

            return {
                id: f.id,
                displayId: f.farmerDetail?.farmer_id || `FARM-${f.id}`,
                name: f.full_name,
                email: f.email,
                phone: f.phone,
                nic: f.nic,
                district: f.farmerDetail?.district || 'N/A',
                zone: displayZone,
                division: displayDivision,
                joined: f.created_at ? f.created_at.toISOString().split('T')[0] : 'N/A'
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedFarmers
        });
    } catch (error) {
        console.error('Error fetching assigned farmers:', error);
        return res.status(500).json({ 
            success: false, 
            error: { 
                message: 'Failed to fetch assigned farmers' 
            } 
        });
    }
};

/**
 * Get Specific Farmer Details
 */
export const getFarmerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        let farmer;
        try {
            farmer = await User.findOne({
                where: { id, role: 'farmer' },
                include: [{
                    model: FarmerDetail,
                    as: 'farmerDetail'
                }],
                attributes: ['id', 'full_name', 'email', 'phone', 'nic', 'created_at', 'avatar', 'profile_picture']
            });
        } catch (dbError) {
            console.error('Database query error:', dbError);
            return res.status(500).json({ 
                success: false, 
                error: { message: 'Failed to fetch farmer details' } 
            });
        }

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
            zone: locations[0]?.zone || 'N/A',
            primaryDivision: locations[0]?.division || 'N/A',
            locations: locations,
            joined: farmer.created_at,
            profilePicture: farmer.avatar || farmer.profile_picture
        };

        return res.status(200).json({
            success: true,
            data: formattedFarmer
        });
    } catch (error) {
        console.error('Error fetching farmer details:', error);
        console.error('Error stack:', error.stack);
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
                    attributes: ['farmer_id', 'district']
                }]
            }],
            order: [['created_at', 'DESC']]
        });

        const formattedReports = reports.map(r => {
            // Parse instructor_attachments if stored as JSON string
            let instructorAttachments = r.instructor_attachments;
            if (typeof instructorAttachments === 'string') {
                try { instructorAttachments = JSON.parse(instructorAttachments); } catch (e) { instructorAttachments = instructorAttachments ? [instructorAttachments] : []; }
            }
            if (!Array.isArray(instructorAttachments)) instructorAttachments = instructorAttachments ? [instructorAttachments] : [];

            // Parse farmer_attachments if stored as JSON string
            let farmerFiles = r.farmer_attachments;
            if (typeof farmerFiles === 'string') {
                try { farmerFiles = JSON.parse(farmerFiles); } catch (e) { farmerFiles = farmerFiles ? [farmerFiles] : []; }
            }
            if (!Array.isArray(farmerFiles)) farmerFiles = farmerFiles ? [farmerFiles] : [];

            // Parse name arrays
            let farmerFileNames = r.farmer_attachment_names;
            if (typeof farmerFileNames === 'string') { try { farmerFileNames = JSON.parse(farmerFileNames); } catch (e) { farmerFileNames = []; } }
            if (!Array.isArray(farmerFileNames)) farmerFileNames = [];

            let attachmentNames = r.instructor_attachment_names;
            if (typeof attachmentNames === 'string') { try { attachmentNames = JSON.parse(attachmentNames); } catch (e) { attachmentNames = []; } }
            if (!Array.isArray(attachmentNames)) attachmentNames = [];

            return {
                id: r.id,
                farmerName: r.user?.full_name || 'N/A',
                farmerId: r.user?.farmerDetail?.farmer_id || 'N/A',
                location: r.user?.farmerDetail?.district || 'N/A',
                reportedDate: r.created_at.toISOString().split('T')[0],
                updatedAt: r.updated_at,
                pestName: r.name,
                pestType: r.type,
                pestCrop: r.crop,
                pestSeverity: r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
                pestNotes: r.notes,
                resolution: r.resolution,
                status: r.status === 'pending' ? 'Pending' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
                farmerFiles,
                farmerFileNames,
                attachments: instructorAttachments,
                attachmentNames
            };
        });

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
        if (typeof attachments === 'string') {
            try { attachments = JSON.parse(attachments); } catch (e) { attachments = attachments ? [attachments] : []; }
        }
        if (!Array.isArray(attachments)) attachments = attachments ? [attachments] : [];

        report.status = status;
        if (resolution) report.resolution = resolution;
        report.instructor_attachments = req.file && req.file.path
            ? [...attachments, req.file.path]
            : [...attachments]; // always new array so Sequelize marks field dirty

        // Track original filename alongside the URL
        let attachmentNames = report.instructor_attachment_names || [];
        if (typeof attachmentNames === 'string') {
            try { attachmentNames = JSON.parse(attachmentNames); } catch (e) { attachmentNames = []; }
        }
        if (!Array.isArray(attachmentNames)) attachmentNames = [];
        report.instructor_attachment_names = req.file && req.file.originalname
            ? [...attachmentNames, req.file.originalname]
            : [...attachmentNames];
        
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
            include: [{ model: User, as: 'user', attributes: ['full_name'], include: [{ model: FarmerDetail, as: 'farmerDetail', attributes: ['farmer_id', 'district', 'locations'] }] }],
            order: [['created_at', 'DESC']]
        });

        const formattedPlans = plans.map(p => {
            let farmerLocations = p.user?.farmerDetail?.locations;
            if (typeof farmerLocations === 'string') { try { farmerLocations = JSON.parse(farmerLocations); } catch (e) { farmerLocations = []; } }
            if (!Array.isArray(farmerLocations)) farmerLocations = [];
            const primaryLocation = farmerLocations[0] || {};

            let farmerFileNames = p.farmer_attachment_names;
            if (typeof farmerFileNames === 'string') { try { farmerFileNames = JSON.parse(farmerFileNames); } catch (e) { farmerFileNames = []; } }
            if (!Array.isArray(farmerFileNames)) farmerFileNames = [];

            let attachmentNames = p.instructor_attachment_names;
            if (typeof attachmentNames === 'string') { try { attachmentNames = JSON.parse(attachmentNames); } catch (e) { attachmentNames = []; } }
            if (!Array.isArray(attachmentNames)) attachmentNames = [];

            return {
                id: p.id,
                farmerName: p.user?.full_name || 'N/A',
                farmerId: p.user?.farmerDetail?.farmer_id || 'N/A',
                location: `${p.user?.farmerDetail?.district || ''} - ${primaryLocation.zone || ''}`,
                submittedDate: p.created_at.toISOString().split('T')[0],
                cropName: p.crop_name,
                plantDate: p.plant_date,
                harvestDate: p.harvest_date,
                cropNotes: p.notes,
                status: p.status === 'pending' ? 'Pending Review' : (p.status.charAt(0).toUpperCase() + p.status.slice(1)),
                instructorFeedback: p.instructor_feedback,
                reviewedDate: p.reviewed_at ? p.reviewed_at.toISOString().split('T')[0] : (p.status !== 'pending' ? p.updated_at.toISOString().split('T')[0] : 'N/A'),
                farmerFiles: p.farmer_attachments || [],
                farmerFileNames,
                attachments: p.instructor_attachments || [],
                attachmentNames
            };
        });

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

            // Track original filename
            let currentNames = plan.instructor_attachment_names || [];
            if (typeof currentNames === 'string') { try { currentNames = JSON.parse(currentNames); } catch (e) { currentNames = []; } }
            if (!Array.isArray(currentNames)) currentNames = [];
            plan.instructor_attachment_names = [...currentNames, req.file.originalname];
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

        // Fetch valid zones from regions table
        const regionRows = await Region.findAll({ order: [['zone', 'ASC']], raw: true });
        const validZones = [...new Set(regionRows.map(r => r.zone))];

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

        // Add instructor_id at top level for consistency with other endpoints
        if (userData.instructorDetail && userData.instructorDetail.instructor_id) {
            userData.instructor_id = userData.instructorDetail.instructor_id;
        }

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
        const rows = await Region.findAll({ order: [['zone', 'ASC'], ['division', 'ASC']], raw: true });
        const hierarchy = {};
        rows.forEach(r => {
            if (!hierarchy[r.zone]) hierarchy[r.zone] = [];
            if (!hierarchy[r.zone].includes(r.division)) {
                hierarchy[r.zone].push(r.division);
            }
        });
        return res.status(200).json({ success: true, data: hierarchy });
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

                // Find divisions that were REMOVED so we can un-assign affected farmers
                const oldDivisions = Array.isArray(detail.assigned_divisions)
                    ? detail.assigned_divisions
                    : (typeof detail.assigned_divisions === 'string'
                        ? JSON.parse(detail.assigned_divisions || '[]')
                        : []);
                const removedDivisions = oldDivisions.filter(d => !requestedDivisions.includes(d));

                detail.assigned_divisions = requestedDivisions;

                // Clear instructor assignment from farmers belonging to removed divisions
                if (removedDivisions.length > 0) {
                    const instructorRefId = detail.instructor_id;
                    const allFarmers = await FarmerDetail.findAll({
                        attributes: ['id', 'locations']
                    });

                    for (const farmer of allFarmers) {
                        let locs = Array.isArray(farmer.locations)
                            ? farmer.locations
                            : (typeof farmer.locations === 'string'
                                ? JSON.parse(farmer.locations || '[]')
                                : []);

                        let changed = false;
                        locs = locs.map(loc => {
                            if (
                                removedDivisions.includes(loc.instructorDivision) &&
                                (loc.assignedInstructorId === instructorRefId ||
                                    loc.assignedInstructorRefId === instructorRefId)
                            ) {
                                changed = true;
                                return {
                                    ...loc,
                                    assignedInstructorId: 'Pending',
                                    assignedInstructorName: 'No Instructor Assigned',
                                    assignedInstructorRefId: ''
                                };
                            }
                            return loc;
                        });

                        if (changed) {
                            farmer.locations = locs;
                            await farmer.save();
                        }
                    }
                }
            }
            await detail.save();
        } else {
            // Generate an instructor ID if it doesn't exist
            const instructorId = `INST-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
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
        return res.status(500).json({ success: false, error: { message: error.message || 'Failed to update profile' } });
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

        // Import models to avoid circular dependencies
        const { InstructorRating, FarmerDetail } = await import('../../models/index.js');

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
                    model: FarmerDetail,
                    as: 'farmer',
                    attributes: ['farmer_id', 'district', 'zone'],
                    required: false
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

        // Emit real-time update to all connected clients
        const reqSocket = req.app.get('socketio');
        if (reqSocket) {
            reqSocket.emit('userProfileUpdated', {
                userId: userId,
                profile_picture: user.profile_picture
            });
        }

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
            order: [['meeting_date', 'DESC']]
        });

        const formattedMeetings = meetings.map(m => ({
            id: m.id,
            meetingTitle: m.meeting_title,
            meetingDate: m.meeting_date,
            meetingTime: m.meeting_time,
            meetingDuration: m.meeting_duration,
            meetingNotes: m.meeting_notes,
            instructorNote: m.instructor_note,
            status: m.status,
            instructor_id: m.instructor_id,
            farmerName: m.farmer?.full_name || 'N/A',
            farmerId: m.farmer?.farmerDetail?.farmer_id || 'N/A',
            division: m.division || 'N/A',
            requestedBy: m.requested_by,
            zoomLink: m.zoom_link,
            suggestedDate: m.suggested_date,
            suggestedTime: m.suggested_time,
            cancelReason: m.cancel_reason,
            updatedAt: m.updated_at,
            createdAt: m.created_at
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
        // Safety check: is Crop model defined?
        if (!Crop) {
            console.error('CRITICAL: Crop model is UNDEFINED in instructorController');
            return res.status(500).json({ success: false, error: { message: 'Crop model not loaded' } });
        }

        const crops = await Crop.findAll({
            order: [['name', 'ASC']]
        });
        
        const formattedCrops = (crops || []).map(crop => ({
            id: crop.id,
            name: crop.name,
            image: crop.image_url
        }));

        return res.status(200).json({ success: true, data: formattedCrops });
    } catch (error) {
        console.error('CRITICAL BACKEND ERROR in getCropCalendars:', error);
        return res.status(500).json({ 
            success: false, 
            error: { 
                message: 'Failed to fetch crop calendars from database',
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
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter[Op.between] = [new Date(startDate), end];
        } else if (startDate) {
            dateFilter[Op.gte] = new Date(startDate);
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter[Op.lte] = end;
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
            if (Object.keys(dateFilter).length > 0) where.meeting_date = dateFilter;
            if (status && status !== 'All') where.status = status.toLowerCase();
            if (division && division !== 'All') where.division = division;

            const meetings = await Meeting.findAll({
                where,
                include: [{ model: User, as: 'farmer', attributes: ['full_name'] }],
                order: [['meeting_date', 'DESC']]
            });

            columns = ['Date', 'Time', 'Farmer', 'Purpose', 'Duration', 'Status', 'Division'];
            reportData = meetings.map(m => [
                m.meeting_date,
                m.meeting_time,
                m.farmer?.full_name || 'N/A',
                m.meeting_title,
                m.meeting_duration + ' mins',
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
        if (status === 'accepted') {
            meeting.suggested_date = null;
            meeting.suggested_time = null;
        }
        if (zoomLink) meeting.zoom_link = zoomLink;
        if (suggestedDate) meeting.suggested_date = suggestedDate;
        if (suggestedTime) meeting.suggested_time = suggestedTime;
        if (instructorNote) meeting.instructor_note = instructorNote;
        if (cancelReason) meeting.cancel_reason = cancelReason;

        await meeting.save();

        return res.status(200).json({ success: true, message: `Meeting ${status} successfully` });
    } catch (error) {
        console.error('Error updating meeting status:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update meeting status' } });
    }
};

/**
 * Delete Instructor Account
 */
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        // Cascade delete details to be safe
        await InstructorDetail.destroy({ where: { user_id: userId } });
        await user.destroy();

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to delete account' } });
    }
};

