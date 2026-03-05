import express from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import {
    submitInstructorRating,
    getInstructorRatings,
    getInstructorRatingSummary,
    deleteInstructorRating,
    getMyRatings
} from './rating.controller.js';

const router = express.Router();

// Farmer routes
router.post('/instructor-rating', authenticate, authorize('farmer'), submitInstructorRating);
router.delete('/instructor-rating', authenticate, authorize('farmer'), deleteInstructorRating);
router.get('/my-ratings', authenticate, authorize('farmer'), getMyRatings);

// Authenticated routes (for viewing instructor ratings — requires login)
router.get('/instructors/:instructor_id/ratings', authenticate, getInstructorRatings);

// Instructor routes (for viewing their own ratings)
router.get('/instructor/ratings/summary', authenticate, authorize('instructor'), getInstructorRatingSummary);

export default router;
