import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { registerRateLimiter, loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting
router.post('/register', registerRateLimiter, registerUser);
router.post('/login', loginRateLimiter, loginUser);

export default router;
