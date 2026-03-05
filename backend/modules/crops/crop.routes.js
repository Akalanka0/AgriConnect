import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';
import {
    createCrop,
    getCrops,
    getCropById,
    updateCrop,
    deleteCrop
} from './crop.controller.js';

const router = express.Router();

// Routes for Crop management
router.post(
    '/',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinaryMiddleware,
    createCrop
);
router.get('/', authenticate, authorize('admin'), getCrops);
router.get('/:id', authenticate, authorize('admin'), getCropById);
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinaryMiddleware,
    updateCrop
);
router.delete('/:id', authenticate, authorize('admin'), deleteCrop);

export default router;
