import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
import {
    createPest,
    getPests,
    getPestById,
    updatePest,
    deletePest
} from './pest.controller.js';

const router = express.Router();

// Routes for Pest management
router.post(
    '/',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinary,
    createPest
);
router.get('/', authenticate, authorize('admin'), getPests);
router.get('/:id', authenticate, authorize('admin'), getPestById);
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinary,
    updatePest
);
router.delete('/:id', authenticate, authorize('admin'), deletePest);

export default router;
