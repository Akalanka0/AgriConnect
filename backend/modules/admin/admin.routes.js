import express from 'express';
import {
    generateIds,
    getGeneratedIds,
    updateIdStatus,
    deleteIdsByStatus,
    getDashboardStats,
    getAdminReportHistory,
    addAdminReportHistory,
    getUsers,
    updateUserStatus,
    deleteUser,
    getEngagementStats,
    getInstructorEngagement,
    inviteAdmin,
    getSystemSettings,
    updateSystemSetting,
    updateProfile,
    removeProfilePicture,
    updatePassword,
    getMyMessages,
    markMessageAsRead,
    deleteMessage,
    getRegionHierarchy,
    getRegions,
    addRegionZone,
    addRegionDivision,
    deleteRegionRow
} from './admin.controller.js';
import { sendMessage, uploadMessageAttachment } from '../messages/message.controller.js';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Message Routes
router.get('/messages', authenticate, authorize('admin'), getMyMessages);
router.post('/messages/send', authenticate, authorize('admin'), uploadMessageAttachment, sendMessage);
router.patch('/messages/:id/read', authenticate, authorize('admin'), markMessageAsRead);
router.delete('/messages/:id', authenticate, authorize('admin'), deleteMessage);

// Dashboard & User Management Routes
router.get('/stats', authenticate, authorize('admin'), getDashboardStats);
// Report History
router.get('/report-history', authenticate, authorize('admin'), getAdminReportHistory);
router.post('/report-history', authenticate, authorize('admin'), addAdminReportHistory);

router.post('/invite', authenticate, authorize('admin'), inviteAdmin);
router.get('/settings', authenticate, authorize('admin'), getSystemSettings);
router.put('/settings/:key', authenticate, authorize('admin'), updateSystemSetting);

// Region Hierarchy Routes
router.get('/region-hierarchy', authenticate, authorize('admin'), getRegionHierarchy);
router.get('/regions', authenticate, authorize('admin'), getRegions);
router.post('/regions/zone', authenticate, authorize('admin'), addRegionZone);
router.post('/regions/division', authenticate, authorize('admin'), addRegionDivision);
router.delete('/regions/:id', authenticate, authorize('admin'), deleteRegionRow);

// Profile Management Routes
router.put('/profile', authenticate, authorize('admin'), upload.single('avatar'), uploadToCloudinaryMiddleware, updateProfile);
router.delete('/profile/picture', authenticate, authorize('admin'), removeProfilePicture);
router.put('/password', authenticate, authorize('admin'), updatePassword);

// Engagement & User Management Routes
router.get('/engagement', authenticate, authorize('admin'), getEngagementStats);
router.get('/engagement/instructors', authenticate, authorize('admin'), getInstructorEngagement);
router.get('/users', authenticate, authorize('admin'), getUsers);
router.put('/users/:id/status', authenticate, authorize('admin'), updateUserStatus);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

// ID Generation Routes
router.post('/ids/generate', authenticate, authorize('admin'), generateIds);
router.get('/ids', authenticate, authorize('admin'), getGeneratedIds);
router.put('/ids/:id/status', authenticate, authorize('admin'), updateIdStatus);
router.delete('/ids/prune', authenticate, authorize('admin'), deleteIdsByStatus);

export default router;
