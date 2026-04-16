import {
    sequelize, 
    User, 
    Message, 
    FarmerDetail, 
    InstructorDetail, 
    CropPlan, 
    PestReport, 
    HarvestRecord, 
    Activity, 
    Meeting 
} from '../../models/index.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';
import { DataService } from '../../services/dataService.js';
import { UserService } from '../../services/userService.js';
import { updateInstructorAverageRating } from '../../services/ratingService.js';

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
 * Get Farmer Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Use DataService for centralized data access
        const stats = await DataService.getFarmerDataSummary(userId);

        // Add meetings count and activities count (specific to farmer dashboard)
        const [meetingsCount, activitiesCount] = await Promise.all([
            Meeting.count({ where: { farmer_id: userId } }),
            Activity.count({ where: { user_id: userId } })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                activeCrops: stats.activeCrops,
                plansSubmitted: stats.activeCrops,
                pestIssues: stats.pestIssues,
                meetings: meetingsCount,
                activitiesCount
            }
        });
    } catch (error) {
        console.error('Error fetching farmer dashboard stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch dashboard stats'
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
        const raw = await DataService.getRecentActivity(userId);

        // Flatten all categories into a normalized array sorted by date desc
        const items = [
            ...(raw.cropPlans || []).map(r => ({
                title: `Crop Plan: ${r.crop_name} (${r.status})`,
                date: r.created_at,
                type: 'cropPlan'
            })),
            ...(raw.pestReports || []).map(r => ({
                title: `Pest Report: ${r.name} (${r.type}) — ${r.severity} severity`,
                date: r.created_at,
                type: 'pestReport'
            })),
            ...(raw.activities || []).map(r => ({
                title: `Activity: ${r.type}${r.crop ? ' — ' + r.crop : ''}${r.notes ? ' (' + r.notes + ')' : ''}`,
                date: r.created_at,
                type: 'activity'
            })),
            ...(raw.harvests || []).map(r => ({
                title: `Harvest: ${r.crop} — ${r.quantity}${r.quality ? ' (' + r.quality + ')' : ''}`,
                date: r.created_at,
                type: 'harvest'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching farmer recent history:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch recent history'
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
                message: 'Failed to fetch instructors'
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
            farmer_attachment_names: req.file ? [req.file.originalname] : [],
            status: 'pending'
        };

        const report = await PestReport.create(reportData);

        return res.status(201).json({
            success: true,
            message: 'Pest report submitted successfully',
            data: report
        });
    } catch (error) {
        console.error('Error submitting pest report:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to submit pest report' }
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

        // Validate required fields
        if (!cropName || !fieldLocation || !plantDate || !harvestDate) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields: cropName, fieldLocation, plantDate, harvestDate' }
            });
        }

        // Handle attachment if uploaded - make it optional and handle failures
        let attachments = [];
        try {
            if (req.file && req.file.path) {
                attachments = [req.file.path];
            } else if (req.body.attachment_url) {
                attachments = [req.body.attachment_url];
            }
        } catch (uploadError) {
            console.warn('Upload failed, continuing without attachment:', uploadError.message);
            // Continue without attachment if upload fails
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
            farmer_attachment_names: req.file ? [req.file.originalname] : [],
            status: 'pending'
        };

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
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'full_name'],
                    required: false,
                    include: [
                        {
                            model: InstructorDetail,
                            as: 'instructorDetail',
                            attributes: ['instructor_id'],
                            required: false
                        }
                    ]
                }
            ],
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

            // Robust parsing for farmer_attachment_names
            let farmerFileNames = report.farmer_attachment_names;
            if (typeof farmerFileNames === 'string') {
                try { farmerFileNames = JSON.parse(farmerFileNames); } catch (e) { farmerFileNames = []; }
            }
            if (!Array.isArray(farmerFileNames)) farmerFileNames = [];

            // Robust parsing for instructor_attachment_names
            let instructorFileNames = report.instructor_attachment_names;
            if (typeof instructorFileNames === 'string') {
                try { instructorFileNames = JSON.parse(instructorFileNames); } catch (e) { instructorFileNames = []; }
            }
            if (!Array.isArray(instructorFileNames)) instructorFileNames = [];

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
                location: report.instructor_division || null,
                instructor_name: report.instructor?.full_name || null,
                instructor_display_id: report.instructor?.instructorDetail?.instructor_id || null,
                farmerFiles,
                farmerFileNames,
                instructorFiles,
                instructorFileNames
            };
        });

        return res.status(200).json({ success: true, data: formattedReports });
    } catch (error) {
        console.error('Error fetching pest reports:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch pest reports' } });
    }
};

export const getMyHarvestRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const farmerId = req.user.farmerDetail?.farmer_id;
        
        const records = await HarvestRecord.findAll({
            where: { user_id: userId },
            order: [['date', 'DESC']]
        });
        
        // Replace internal user_id with generated farmer_id
        const formattedRecords = records.map(record => {
            const plainRecord = record.get({ plain: true });
            if (farmerId) {
                plainRecord.user_id = farmerId;
            }
            return plainRecord;
        });
        
        return res.status(200).json({ success: true, data: formattedRecords });
    } catch (error) {
        console.error('Error fetching harvest records:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch harvest records' } });
    }
};

export const getMyActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const farmerId = req.user.farmerDetail?.farmer_id;
        
        const activities = await Activity.findAll({
            where: { user_id: userId },
            order: [['date', 'DESC']]
        });
        
        // Replace internal user_id with generated farmer_id
        const formattedActivities = activities.map(activity => {
            const plainActivity = activity.get({ plain: true });
            if (farmerId) {
                plainActivity.user_id = farmerId;
            }
            return plainActivity;
        });
        
        return res.status(200).json({ success: true, data: formattedActivities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch activities' } });
    }
};

export const getMyCropPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const farmerId = req.user.farmerDetail?.farmer_id;
        
        const plans = await CropPlan.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'full_name'],
                    required: false,
                    include: [
                        {
                            model: InstructorDetail,
                            as: 'instructorDetail',
                            attributes: ['instructor_id'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Ensure instructor_attachments are properly handled if they are stored as JSON strings
        const formattedPlans = plans.map(p => {
            const plan = p.get({ plain: true });
            
            // Replace internal user_id with generated farmer_id
            if (farmerId) {
                plan.user_id = farmerId;
            }

            // Add instructor info as flat fields
            plan.instructor_name = plan.instructor?.full_name || null;
            plan.instructor_display_id = plan.instructor?.instructorDetail?.instructor_id || null;
            delete plan.instructor;
            
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

            // Ensure name arrays are proper arrays
            if (typeof plan.farmer_attachment_names === 'string') {
                try { plan.farmer_attachment_names = JSON.parse(plan.farmer_attachment_names); } catch (e) { plan.farmer_attachment_names = []; }
            }
            if (!Array.isArray(plan.farmer_attachment_names)) plan.farmer_attachment_names = [];

            if (typeof plan.instructor_attachment_names === 'string') {
                try { plan.instructor_attachment_names = JSON.parse(plan.instructor_attachment_names); } catch (e) { plan.instructor_attachment_names = []; }
            }
            if (!Array.isArray(plan.instructor_attachment_names)) plan.instructor_attachment_names = [];

            return plan;
        });

        return res.status(200).json({ success: true, data: formattedPlans });
    } catch (error) {
        console.error('Error fetching crop plans:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch crop plans' } });
    }
};

/**
 * Meeting Management
 */
export const requestMeeting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { meetingTitle, meetingDate, meetingTime, meetingDuration, meetingNotes, division } = req.body;

        // Find the instructor assigned to this division
        let resolvedInstructorId = null;
        if (division) {
            const instructorDetail = await InstructorDetail.findOne({
                where: sequelize.literal(`JSON_CONTAINS(assigned_divisions, ${sequelize.escape(JSON.stringify(division))})`)
            });
            if (instructorDetail) {
                resolvedInstructorId = instructorDetail.user_id;
            }
        }

        const meeting = await Meeting.create({
            farmer_id: userId,
            meeting_title: meetingTitle,
            meeting_date: meetingDate,
            meeting_time: meetingTime,
            meeting_duration: meetingDuration,
            meeting_notes: meetingNotes,
            instructor_id: resolvedInstructorId,
            division,
            requested_by: 'farmer',
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
                attributes: ['id', 'full_name', 'email', 'phone'],
                include: [{
                    model: InstructorDetail,
                    as: 'instructorDetail',
                    required: false,
                    attributes: ['instructor_id']
                }]
            }],
            order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']]
        });

        const mapped = meetings.map(m => {
            const raw = m.toJSON();
            return {
                id: raw.id,
                meetingTitle: raw.meeting_title,
                meetingDate: raw.meeting_date,
                meetingTime: raw.meeting_time,
                meetingDuration: raw.meeting_duration,
                meetingNotes: raw.meeting_notes,
                instructorNote: raw.instructor_note,
                status: raw.status,
                requestedBy: raw.requested_by,
                farmerId: raw.farmer_id,
                instructorId: raw.instructor_id,
                instructorDisplayId: raw.instructor?.instructorDetail?.instructor_id || null,
                instructorName: raw.instructor ? raw.instructor.full_name : null,
                instructorEmail: raw.instructor ? raw.instructor.email : null,
                division: raw.division,
                suggestedDate: raw.suggested_date,
                suggestedTime: raw.suggested_time,
                zoomLink: raw.zoom_link,
                cancelReason: raw.cancel_reason,
                createdAt: raw.created_at,
                updatedAt: raw.updated_at
            };
        });

        return res.status(200).json({ success: true, data: mapped });
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
        meeting.cancel_reason = reason;
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

        meeting.meeting_date = meetingDate;
        meeting.meeting_time = meetingTime;
        meeting.status = 'accepted';
        meeting.suggested_date = null;
        meeting.suggested_time = null;
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
        const responseData = {
            ...userData,
            ...userData.farmerDetail
        };
        // Keep farmerDetail for compatibility but make properties top-level
        delete responseData.farmerDetail;

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, email, phone, district, locations } = req.body;

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
            detail.district = district !== undefined ? district : detail.district;
            detail.locations = locations !== undefined ? locations : detail.locations;
            await detail.save();
        } else {
            // Generate a farmer ID if it doesn't exist
            const farmerId = `FARM-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
            await FarmerDetail.create({
                user_id: userId,
                farmer_id: farmerId,
                district,
                locations: locations || []
            });
        }

        return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, error: { message: error.message || 'Failed to update profile' } });
    }
};

/**
 * Update Farmer Profile Picture
 */
export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        // Handle file upload from Cloudinary middleware
        let profilePictureUrl = null;
        if (req.file) {
            // If file was processed through upload middleware
            if (req.file.secure_url) {
                // Cloudinary upload
                profilePictureUrl = req.file.secure_url;
            } else if (req.file.path) {
                // Traditional file upload
                profilePictureUrl = req.file.path.replace(/\\/g, '/');
            } else if (req.file.public_id) {
                // Cloudinary public_id fallback
                profilePictureUrl = req.file.public_id;
            }
        }

        if (!profilePictureUrl) {
            return res.status(400).json({ success: false, error: { message: 'No valid file uploaded' } });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        user.profile_picture = profilePictureUrl;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: { profile_picture: profilePictureUrl }
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to update profile picture' }
        });
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
            if (msg.recipient_type === 'farmers') {
                return 'All Farmers';
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
                    { recipient_type: 'farmers' },
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
        
        let { subject, content, recipient_id, recipient_type, recipient_ids } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ success: false, error: { message: 'Subject and content are required' } });
        }

        // Parse recipient_ids if sent as JSON string from FormData
        if (typeof recipient_ids === 'string') {
            try { recipient_ids = JSON.parse(recipient_ids); } catch { recipient_ids = null; }
        }

        // If recipient_ids array provided (from MessageModal), use first entry as recipient_id
        if (!recipient_id && Array.isArray(recipient_ids) && recipient_ids.length > 0) {
            recipient_id = recipient_ids[0];
        }

        // Normalise recipient_id to integer
        if (recipient_id) recipient_id = parseInt(recipient_id, 10);

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
            attachment_public_id,
            message_type: req.file ? 'file' : 'text'
        });

        // Emit WebSocket event
        if (io) {
            // Look up the farmer's generated ID
            const senderUser = await User.findByPk(userId, {
                attributes: ['id', 'full_name'],
                include: [{ model: FarmerDetail, as: 'farmerDetail', required: false, attributes: ['farmer_id'] }]
            });
            const senderDisplayId = senderUser?.farmerDetail?.farmer_id || null;
            const senderName = senderUser?.full_name || 'Farmer';

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
            
            const senderMessageData = { ...messageData, type: 'sent' };
            
            if (recipient_type === 'all') {
                io.emit('newMessage', messageData);
            } else if (recipient_type === 'admin') {
                io.to('admin').emit('newMessage', messageData);
                io.to(`user_${userId}`).emit('newMessage', senderMessageData);
            } else if (recipient_type === 'instructors') {
                io.to('instructor').emit('newMessage', messageData);
                io.to(`user_${userId}`).emit('newMessage', senderMessageData);
            } else if (recipient_id) {
                io.to(`user_${recipient_id}`).emit('newMessage', messageData);
                io.to(`user_${userId}`).emit('newMessage', senderMessageData);
            }
        }

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
                    { recipient_type: 'farmers' }  // Farmer broadcast messages
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
        const { InstructorRating } = await import('../../models/index.js');

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
/**
 * Delete Farmer Account
 */
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: { message: 'User not found' } });
        }

        // Cascade delete details to be safe
        await FarmerDetail.destroy({ where: { user_id: userId } });
        await user.destroy();

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to delete account' } });
    }
};