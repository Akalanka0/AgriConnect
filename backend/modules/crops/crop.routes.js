import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
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
    uploadToCloudinary,
    createCrop
);
router.get('/', authenticate, authorize('admin'), getCrops);
router.get('/:id', authenticate, authorize('admin'), getCropById);
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinary,
    updateCrop
);
router.delete('/:id', authenticate, authorize('admin'), deleteCrop);

export default router;
