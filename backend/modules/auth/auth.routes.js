import express from 'express';
import { registerUser, loginUser, verifyEmail, sendEmailOTP, verifyEmailOTP } from './auth.controller.js';
import { forgotPassword, verifyOTPController, resetPassword } from './passwordReset.controller.js';
import { registerRateLimiter, loginRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Backend connection successful!', timestamp: new Date() });
});

// Apply rate limiting
router.post('/register', registerRateLimiter, registerUser);
router.post('/login', loginRateLimiter, loginUser);

router.get('/verify-email', verifyEmail);

// Email verification by OTP
router.post('/send-email-otp', sendEmailOTP);
router.post('/verify-email-otp', verifyEmailOTP);

// Password reset endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTPController);
router.post('/reset-password', resetPassword);

export default router;
