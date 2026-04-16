import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';
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
    deleteMessage,
    deleteAccount,
    submitInstructorRating,
    uploadMessageAttachment,
    sendMessage
} from './farmer.controller.js';
import { getRegionHierarchy, getCropCalendars as getRefCalendars } from '../instructor/instructor.controller.js';
import {
    deleteInstructorRating,
    getMyRatings
} from '../ratings/rating.controller.js';
import { updatePassword } from '../admin/admin.controller.js';

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
router.post('/pest-reports', upload.single('attachment'), uploadToCloudinaryMiddleware, reportPest);
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
router.post('/crop-plans', upload.single('attachment'), uploadToCloudinaryMiddleware, submitCropPlan);
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
router.delete('/profile', deleteAccount);
router.put('/password', updatePassword);
router.post('/profile/picture', upload.single('profile_picture'), uploadToCloudinaryMiddleware, updateProfilePicture);
router.delete('/profile/picture', removeProfilePicture);
router.get('/region-hierarchy', getRegionHierarchy);

// Messages
router.get('/messages', getMyMessages);
router.post('/messages', uploadMessageAttachment, sendMessage);
router.patch('/messages/:id/read', markMessageAsRead);
router.delete('/messages/:id', deleteMessage);

export default router;
