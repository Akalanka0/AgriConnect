import {
    Activity,
    PestReport,
    HarvestRecord,
    CropPlan,
    User,
    InstructorDetail,
    FarmerDetail,
    Message,
    Meeting
} from '../../models/index.js';
import { Op } from 'sequelize';
import { DataService } from '../../services/dataService.js';
import { UserService } from '../../services/userService.js';

/**
 * Get Farmer Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use DataService for centralized data access
        const stats = await DataService.getFarmerDataSummary(userId);

        // Add meetings count (specific to farmer dashboard)
        const meetingsCount = await Meeting.count({
            where: {
                farmer_id: userId
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                activeCrops: stats.activeCrops,
                plansSubmitted: stats.activeCrops,
                pestIssues: stats.pestIssues,
                meetings: meetingsCount
            }
        });
    } catch (error) {
        console.error('Error fetching farmer dashboard stats:', error);
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
 * Get Farmer Recent History
 */
export const getRecentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use DataService for centralized data access
        const recentHistory = await DataService.getRecentActivity(userId);

        return res.status(200).json({
            success: true,
            data: recentHistory
        });
    } catch (error) {
        console.error('Error fetching farmer recent history:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch recent history',
                details: error.message
            }
        });
    }
};

/**
 * Get Available Instructors
 */
export const getInstructors = async (req, res) => {
    try {
        // Use UserService for centralized user operations
        const instructors = await UserService.getAvailableInstructors();

        return res.status(200).json({
            success: true,
            data: instructors
        });
    } catch (error) {
        console.error('Error fetching instructors:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch instructors',
                details: error.message
            }
        });
    }
};

/**
 * Report Pest
 */
export const reportPest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { issue_type, name, crop, severity, description, instructor_id, instructor_division } = req.body;

        console.log('--- Pest Report Submission Debug ---');
        console.log('User ID:', userId);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        // Handle attachment if uploaded
        let attachments = [];
        if (req.file && req.file.path) {
            attachments = [req.file.path];
        }

        // Normalize severity and type to match ENUMs
        const normalizedType = issue_type ? issue_type.toLowerCase() : 'other';
        const normalizedSeverity = severity ? severity.toLowerCase() : 'medium';

        // VERY CAREFUL check for instructor_id
        let parsedInstructorId = null;
        if (instructor_id && instructor_id !== 'null' && instructor_id !== 'undefined' && instructor_id !== '') {
            parsedInstructorId = parseInt(instructor_id);
            if (isNaN(parsedInstructorId)) {
                parsedInstructorId = null;
            }
        }

        const reportData = {
            user_id: userId,
            type: normalizedType,
            name: name || 'Unknown Issue',
            crop: crop || 'Unknown Crop',
            severity: normalizedSeverity,
            notes: description,
            instructor_id: parsedInstructorId,
            instructor_division: instructor_division || null,
            farmer_attachments: attachments,
            status: 'pending'
        };

        console.log('Final Report Data for Sequelize:', reportData);

        const report = await PestReport.create(reportData);

        return res.status(201).json({
            success: true,
            message: 'Pest report submitted successfully',
            data: report
        });
    } catch (error) {
        console.error('--- PEST REPORT SUBMISSION ERROR ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.errors) {
            console.error('Validation Errors:', error.errors.map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            })));
        }
        if (error.original) {
            console.error('Original DB Error:', error.original.message);
            console.error('SQL Statement:', error.sql);
        }
        console.error('Stack Trace:', error.stack);
        console.error('-------------------------------------');

        return res.status(500).json({
            success: false,
            error: { 
                message: 'Failed to submit pest report',
                details: error.message,
                type: error.name,
                validationErrors: error.errors ? error.errors.map(e => e.message) : undefined
            }
        });
    }
};

/**
 * Record Harvest
 */
export const recordHarvest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { crop, location, date, harvest_date, quantity, quality, notes, instructorDivision } = req.body;

        const record = await HarvestRecord.create({
            user_id: userId,
            crop,
            location,
            date: date || harvest_date,
            quantity,
            quality,
            notes,
            instructor_division: instructorDivision
        });

        return res.status(201).json({
            success: true,
            message: 'Harvest recorded successfully',
            data: record
        });
    } catch (error) {
        console.error('Error recording harvest:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to record harvest' }
        });
    }
};

/**
 * Delete Harvest Record
 */
export const deleteHarvestRecord = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const record = await HarvestRecord.findOne({ where: { id, user_id: userId } });
        if (!record) {
            return res.status(404).json({ success: false, error: { message: 'Harvest record not found' } });
        }

        await record.destroy();

        return res.status(200).json({
            success: true,
            message: 'Harvest record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting harvest record:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to delete harvest record' }
        });
    }
};

/**
 * Log Activity
 */
export const logActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, activity_type, crop, date, activity_date, notes, instructorDivision, location } = req.body;

        const activity = await Activity.create({
            user_id: userId,
            type: type || activity_type,
            crop,
            date: date || activity_date,
            notes,
            instructor_division: instructorDivision,
            location: location || req.body.fieldLocation // Also handle fieldLocation from frontend
        });

        return res.status(201).json({
            success: true,
            message: 'Activity logged successfully',
            data: activity
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to log activity' }
        });
    }
};

/**
 * Delete Activity
 */
export const deleteActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const activity = await Activity.findOne({ where: { id, user_id: userId } });
        if (!activity) {
            return res.status(404).json({ success: false, error: { message: 'Activity not found' } });
        }

        await activity.destroy();

        return res.status(200).json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting activity:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to delete activity' }
        });
    }
};

/**
 * Submit Crop Plan
 */
export const submitCropPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cropName, fieldLocation, plantDate, harvestDate, notes, instructorId, instructorDivision } = req.body;

        console.log('Submitting crop plan for user:', userId);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        // Handle attachment if uploaded
        let attachments = [];
        if (req.file && req.file.path) {
            attachments = [req.file.path];
        } else if (req.body.attachment_url) {
            attachments = [req.body.attachment_url];
        }

        const parsedInstructorId = (instructorId && instructorId !== 'null' && instructorId !== '') ? parseInt(instructorId) : null;
        
        const planData = {
            user_id: userId,
            crop_name: cropName,
            field_location: fieldLocation,
            plant_date: plantDate,
            harvest_date: harvestDate,
            notes,
            instructor_id: isNaN(parsedInstructorId) ? null : parsedInstructorId,
            instructor_division: instructorDivision,
            farmer_attachments: attachments,
            status: 'pending'
        };

        console.log('Creating CropPlan with data:', planData);

        const plan = await CropPlan.create(planData);

        return res.status(201).json({
            success: true,
            message: 'Crop plan submitted successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error submitting crop plan:', error);
        return res.status(500).json({
            success: false,
            error: { 
                message: 'Failed to submit crop plan',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};

/**
 * Get Farmer's Own Data
 */
export const getMyPestReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const reports = await PestReport.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        
        const formattedReports = reports.map(r => {
            const report = r.get({ plain: true });
            
            // Robust parsing for farmer_attachments
            let farmerFiles = report.farmer_attachments;
            if (typeof farmerFiles === 'string') {
                try {
                    farmerFiles = JSON.parse(farmerFiles);
                } catch (e) {
                    farmerFiles = farmerFiles ? [farmerFiles] : [];
                }
            }
            if (!Array.isArray(farmerFiles)) {
                farmerFiles = farmerFiles ? [farmerFiles] : [];
            }

            // Robust parsing for instructor_attachments
            let instructorFiles = report.instructor_attachments;
            if (typeof instructorFiles === 'string') {
                try {
                    instructorFiles = JSON.parse(instructorFiles);
                } catch (e) {
                    instructorFiles = instructorFiles ? [instructorFiles] : [];
                }
            }
            if (!Array.isArray(instructorFiles)) {
                instructorFiles = instructorFiles ? [instructorFiles] : [];
            }

            return {
                id: report.id,
                name: report.name,
                issue_type: report.type,
                crop: report.crop,
                severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
                description: report.notes,
                status: report.status,
                resolution: report.resolution,
                created_at: report.created_at,
                farmerFiles,
                instructorFiles
            };
        });

        return res.status(200).json({ success: true, data: formattedReports });
    } catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const getMyHarvestRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const records = await HarvestRecord.findAll({
            where: { user_id: userId },
            order: [['date', 'DESC']]
        });
        return res.status(200).json({ success: true, data: records });
    } catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const getMyActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const activities = await Activity.findAll({
            where: { user_id: userId },
            order: [['date', 'DESC']]
        });
        return res.status(200).json({ success: true, data: activities });
    } catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const getMyCropPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const plans = await CropPlan.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });

        // Ensure instructor_attachments are properly handled if they are stored as JSON strings
        const formattedPlans = plans.map(p => {
            const plan = p.get({ plain: true });
            
            // Handle instructor_attachments if it's a string (though model says JSON, sometimes Sequelize returns strings)
            if (typeof plan.instructor_attachments === 'string') {
                try {
                    plan.instructor_attachments = JSON.parse(plan.instructor_attachments);
                } catch (e) {
                    plan.instructor_attachments = plan.instructor_attachments ? [plan.instructor_attachments] : [];
                }
            }
            
            // Ensure it's an array
            if (!Array.isArray(plan.instructor_attachments)) {
                plan.instructor_attachments = plan.instructor_attachments ? [plan.instructor_attachments] : [];
            }

            return plan;
        });

        return res.status(200).json({ success: true, data: formattedPlans });
    } catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};

/**
 * Meeting Management
 */
export const requestMeeting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { meetingTitle, meetingDate, meetingTime, meetingDuration, meetingNotes, instructorId, division } = req.body;

        const meeting = await Meeting.create({
            farmer_id: userId,
            meetingTitle,
            meetingDate,
            meetingTime,
            meetingDuration,
            meetingNotes,
            instructor_id: instructorId,
            division,
            requestedBy: 'farmer',
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Meeting requested successfully',
            data: meeting
        });
    } catch (error) {
        console.error('Error requesting meeting:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to request meeting' }
        });
    }
};

export const getMyMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const meetings = await Meeting.findAll({
            where: { farmer_id: userId },
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['full_name', 'email', 'phone']
            }],
            order: [['meetingDate', 'ASC'], ['meetingTime', 'ASC']]
        });
        return res.status(200).json({ success: true, data: meetings });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch meetings' } });
    }
};

export const cancelMeeting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        const meeting = await Meeting.findOne({ where: { id, farmer_id: userId } });
        if (!meeting) {
            return res.status(404).json({ success: false, error: { message: 'Meeting not found' } });
        }

        meeting.status = 'cancelled';
        meeting.cancelReason = reason;
        await meeting.save();

        return res.status(200).json({ success: true, message: 'Meeting cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to cancel meeting' } });
    }
};

export const acceptReschedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { meetingDate, meetingTime } = req.body;

        const meeting = await Meeting.findOne({ where: { id, farmer_id: userId } });
        if (!meeting) {
            return res.status(404).json({ success: false, error: { message: 'Meeting not found' } });
        }

        meeting.meetingDate = meetingDate;
        meeting.meetingTime = meetingTime;
        meeting.status = 'accepted';
        meeting.suggestedDate = null;
        meeting.suggestedTime = null;
        await meeting.save();

        return res.status(200).json({ success: true, message: 'Reschedule accepted successfully' });
    } catch (error) {
        console.error('Error accepting reschedule:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to accept reschedule' } });
    }
};

/**
 * Profile Management
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            include: [{
                model: FarmerDetail,
                as: 'farmerDetail'
            }],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        // Flatten the response for easier frontend access
        const userData = user.toJSON();
        console.log('🔍 [Backend] Raw user with detail:', userData);

        const responseData = {
            ...userData,
            ...userData.farmerDetail
        };
        // Keep farmerDetail for compatibility but make properties top-level
        delete responseData.farmerDetail;

        console.log('🔍 [Backend] Flattened response data:', responseData);

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, email, phone, district, zone, instructor_division, locations } = req.body;

        console.log('📬 [Backend] Update Profile Request Body:', {
            userId,
            fullName: full_name,
            email,
            locationsCount: locations ? locations.length : 'N/A',
            locations: locations
        });

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        // Update User basic info
        user.full_name = full_name || user.full_name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        await user.save();

        // Update or create FarmerDetail
        let detail = await FarmerDetail.findOne({ where: { user_id: userId } });
        if (detail) {
            console.log('📄 [Backend] Existing detail found. Updating...');
            detail.district = district !== undefined ? district : detail.district;
            detail.zone = zone !== undefined ? zone : detail.zone;
            detail.instructor_division = instructor_division !== undefined ? instructor_division : detail.instructor_division;
            detail.locations = locations !== undefined ? locations : detail.locations;
            await detail.save();
            console.log('✅ [Backend] Detail updated successfully');
        } else {
            console.log('📄 [Backend] No detail found. Creating new...');
            // Generate a farmer ID if it doesn't exist
            const farmerId = `FARM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await FarmerDetail.create({
                user_id: userId,
                farmer_id: farmerId,
                district,
                zone,
                instructor_division,
                locations: locations || []
            });
            console.log('✅ [Backend] Detail created successfully');
        }

        return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('❌ [Backend] Error updating profile:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
    }
};

/**
 * Update Farmer Profile Picture
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
        user.avatar = user.profile_picture; // Sync avatar field
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
 * Remove Farmer Profile Picture
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
            data: { profile_picture: null }
        });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to remove profile picture' } });
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
            if (msg.recipient_type === 'farmers') {
                return 'All Farmers';
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
                    { recipient_type: 'farmers' },
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
                messageType = 'received'; // Messages sent specifically TO this farmer
            } else if (msg.recipient_type === 'all' || msg.recipient_type === 'farmers') {
                messageType = 'received'; // Broadcast messages
            } else {
                messageType = 'received'; // Other received messages (including admin messages)
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
        console.log('📩 [Farmer] Sending Message - Body:', req.body);
        console.log('📎 [Farmer] Sending Message - File:', req.file);
        const userId = req.user.id;
        const { subject, content, recipient_id, recipient_type } = req.body;

        // Handle file upload from middleware
        let attachment_url = req.body.attachment_url;
        let attachment_name = req.body.attachment_name;
        let attachment_public_id = req.body.attachment_public_id;

        if (req.file) {
            attachment_url = req.file.path;
            attachment_name = req.file.originalname;
            attachment_public_id = req.file.public_id;
        }

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

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
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
                    { recipient_type: 'farmers' }  // Broadcast to farmers
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
 * Submit Instructor Rating
 */
export const submitInstructorRating = async (req, res) => {
    try {
        const { instructor_id, rating, comments } = req.body;
        const farmerId = req.user.farmerDetail?.farmer_id;
        const farmerName = req.user.full_name;

        if (!farmerId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Farmer profile not found' } 
            });
        }

        // Validate rating
        if (!instructor_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Valid instructor ID and rating (1-5) are required' } 
            });
        }

        // Check if instructor exists
        const instructor = await InstructorDetail.findOne({
            where: { instructor_id }
        });

        if (!instructor) {
            return res.status(404).json({ 
                success: false, 
                error: { message: 'Instructor not found' } 
            });
        }

        // Import InstructorRating model here to avoid circular dependencies
        const { InstructorRating } = await import('../models/index.js');

        // Check if farmer has already rated this instructor
        const existingRating = await InstructorRating.findOne({
            where: { 
                instructor_id, 
                farmer_id: farmerId 
            }
        });

        let ratingRecord;
        if (existingRating) {
            // Update existing rating
            ratingRecord = await existingRating.update({
                rating,
                comments,
                status: 'approved',
                updated_at: new Date()
            });
        } else {
            // Create new rating
            ratingRecord = await InstructorRating.create({
                instructor_id,
                farmer_id: farmerId,
                farmer_name: farmerName,
                rating,
                comments,
                status: 'approved'
            });
        }

        // Update instructor's average rating
        await updateInstructorAverageRating(instructor_id);

        res.status(201).json({
            success: true,
            message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
            data: ratingRecord
        });

    } catch (error) {
        console.error('Error submitting instructor rating:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to submit rating' } 
        });
    }
};

// Update instructor's average rating
const updateInstructorAverageRating = async (instructor_id) => {
    try {
        const { InstructorRating } = await import('../models/index.js');
        
        const ratings = await InstructorRating.findAll({
            where: { 
                instructor_id,
                status: 'approved'
            },
            attributes: ['rating']
        });

        if (ratings.length === 0) {
            await InstructorDetail.update(
                { average_rating: 0 },
                { where: { instructor_id } }
            );
            return;
        }

        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        await InstructorDetail.update(
            { average_rating: parseFloat(averageRating.toFixed(1)) },
            { where: { instructor_id } }
        );

    } catch (error) {
        console.error('Error updating instructor average rating:', error);
    }
};
