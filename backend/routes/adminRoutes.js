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
    getInstructorEngagement
} from '../controllers/adminController.js';
import { sendMessage } from '../controllers/messageController.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Message Routes
router.post('/messages/send', authenticate, authorize('admin'), upload.single('attachment'), sendMessage);

// Dashboard & User Management Routes
router.get('/stats', getDashboardStats);
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
