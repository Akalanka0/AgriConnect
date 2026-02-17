import express from 'express';
import {
    generateIds,
    getGeneratedIds,
    updateIdStatus,
    deleteIdsByStatus,
    getDashboardStats,
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
    markMessageAsRead
} from './admin.controller.js';
import { sendMessage } from '../messages/message.controller.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Message Routes
router.get('/messages', authenticate, authorize('admin'), getMyMessages);
router.post('/messages/send', authenticate, authorize('admin'), upload.single('attachment'), uploadToCloudinary, sendMessage);
router.patch('/messages/:id/read', authenticate, authorize('admin'), markMessageAsRead);

// Dashboard & User Management Routes
router.get('/stats', getDashboardStats);
router.post('/invite', authenticate, authorize('admin', 'Super Admin'), inviteAdmin);
router.get('/settings', authenticate, authorize('admin', 'Super Admin'), getSystemSettings);
router.put('/settings/:key', authenticate, authorize('admin', 'Super Admin'), updateSystemSetting);
router.put('/profile', authenticate, authorize('admin', 'Super Admin'), upload.single('avatar'), uploadToCloudinary, updateProfile);
router.delete('/profile/picture', authenticate, authorize('admin', 'Super Admin'), removeProfilePicture);
router.put('/password', authenticate, authorize('admin', 'Super Admin'), updatePassword);
router.get('/engagement', getEngagementStats);
router.get('/engagement/instructors', getInstructorEngagement);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// ID Generation Routes
router.post('/ids/generate', generateIds);
router.get('/ids', getGeneratedIds);
router.put('/ids/:id/status', updateIdStatus);
router.delete('/ids/prune', deleteIdsByStatus);

export default router;
