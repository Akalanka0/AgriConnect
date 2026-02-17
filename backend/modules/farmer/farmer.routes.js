import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
import {
    getDashboardStats,
    getRecentHistory,
    getInstructors,
    reportPest,
    recordHarvest,
    deleteHarvestRecord,
    logActivity,
    deleteActivity,
    submitCropPlan,
    getMyPestReports,
    getMyHarvestRecords,
    getMyActivities,
    getMyCropPlans,
    requestMeeting,
    getMyMeetings,
    cancelMeeting,
    acceptReschedule,
    getProfile,
    updateProfile,
    updateProfilePicture,
    removeProfilePicture,
    getMyMessages,
    markMessageAsRead,
    submitInstructorRating
} from './farmer.controller.js';
import { sendMessage } from '../messages/message.controller.js'; // Use shared message controller
import { getRegionHierarchy, getCropCalendars as getRefCalendars } from '../instructor/instructor.controller.js';
import {
    deleteInstructorRating,
    getMyRatings
} from '../ratings/rating.controller.js';

const router = express.Router();

// All farmer routes require authentication and farmer role
router.use(authenticate);
router.use(authorize('farmer'));

// Dashboard and General
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/history', getRecentHistory);
router.get('/instructors', getInstructors);
router.post('/instructor-rating', submitInstructorRating);
router.delete('/instructor-rating', deleteInstructorRating);
router.get('/my-ratings', getMyRatings);

// Pest Management
router.post('/pest-reports', upload.single('attachment'), uploadToCloudinary, reportPest);
router.get('/pest-reports', getMyPestReports);

// Harvest Tracking
router.post('/harvest-records', recordHarvest);
router.get('/harvest-records', getMyHarvestRecords);
router.delete('/harvest-records/:id', deleteHarvestRecord);

// Activity Logging
router.post('/activities', logActivity);
router.get('/activities', getMyActivities);
router.delete('/activities/:id', deleteActivity);

// Crop Planning
router.post('/crop-plans', upload.single('attachment'), uploadToCloudinary, submitCropPlan);
router.get('/crop-plans', getMyCropPlans);
router.get('/crop-calendars', getRefCalendars);

// Meetings
router.post('/meetings', requestMeeting);
router.get('/meetings', getMyMeetings);
router.patch('/meetings/:id/cancel', cancelMeeting);
router.patch('/meetings/:id/accept-reschedule', acceptReschedule);

// Profile & Settings
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/picture', upload.single('profile_picture'), uploadToCloudinary, updateProfilePicture);
router.delete('/profile/picture', removeProfilePicture);
router.get('/region-hierarchy', getRegionHierarchy);

// Messages
router.get('/messages', getMyMessages);
router.post('/messages', upload.single('attachment'), uploadToCloudinary, sendMessage);
router.patch('/messages/:id/read', markMessageAsRead);

export default router;
