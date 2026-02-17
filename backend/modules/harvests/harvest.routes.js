import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';
import {
    createHarvest,
    getHarvests,
    getHarvestById,
    updateHarvest,
    deleteHarvest
} from './harvest.controller.js';

const router = express.Router();

// Routes for Harvest management
router.post(
    '/',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinary,
    createHarvest
);
router.get('/', authenticate, authorize('admin'), getHarvests);
router.get('/:id', authenticate, authorize('admin'), getHarvestById);
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    upload.single('image'),
    uploadToCloudinary,
    updateHarvest
);
router.delete('/:id', authenticate, authorize('admin'), deleteHarvest);

export default router;
