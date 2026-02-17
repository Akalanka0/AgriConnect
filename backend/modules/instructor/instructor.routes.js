import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
import {
    getDashboardStats,
    getRecentHistory,
    getAssignedFarmers,
    getFarmerDetails,
    getPestReports,
    updatePestReportStatus,
    getCropPlans,
    updateCropPlanStatus,
    getProfile,
    getTakenDivisions,
    getRegionHierarchy,
    updateProfile,
    updateProfilePicture,
    removeProfilePicture,
    getMeetings,
    updateMeetingStatus,
    getReportsData,
    getMyMessages,
    markMessageAsRead,
    getInstructorRatings,
    getCropCalendars,
    updateCropCalendar,
    removeCropCalendarImage
} from './instructor.controller.js';
import { sendMessage } from '../messages/message.controller.js'; // Use shared message controller
import { updatePassword } from '../admin/admin.controller.js';

const router = express.Router();

// All instructor routes require authentication and instructor role
router.use(authenticate);
router.use(authorize('instructor'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/history', getRecentHistory);

// Farmer Management
router.get('/farmers', getAssignedFarmers);
router.get('/farmers/:id', getFarmerDetails);

// Pest Reports
router.get('/pest-reports', getPestReports);
router.patch('/pest-reports/:id/status', upload.single('attachment'), uploadToCloudinary, updatePestReportStatus);

// Crop Plans
router.get('/crop-plans', getCropPlans);
router.patch('/crop-plans/:id/status', upload.single('attachment'), uploadToCloudinary, updateCropPlanStatus);

// Crop Calendars (Reference)
router.get('/crop-calendars', getCropCalendars);
router.post('/crop-calendars/:id/image', upload.single('image'), uploadToCloudinary, updateCropCalendar);
router.delete('/crop-calendars/:id/remove-image', removeCropCalendarImage);

// Meetings/Schedule
router.get('/meetings', getMeetings);
router.patch('/meetings/:id/status', updateMeetingStatus);

// Profile
router.get('/profile', getProfile);
router.get('/taken-divisions', getTakenDivisions);
router.get('/region-hierarchy', getRegionHierarchy);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/profile/picture', upload.single('profile_picture'), uploadToCloudinary, updateProfilePicture);
router.delete('/profile/picture', removeProfilePicture);

// Ratings
router.get('/ratings', getInstructorRatings);

// Reports
router.get('/reports', getReportsData);

// Messages
router.get('/messages', getMyMessages);
router.post('/messages', upload.single('attachment'), uploadToCloudinary, sendMessage);
router.patch('/messages/:id/read', markMessageAsRead);

export default router;
