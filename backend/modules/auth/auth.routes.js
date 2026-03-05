import express from 'express';
import { registerUser, loginUser, verifyEmail, sendEmailOTP, verifyEmailOTP } from './auth.controller.js';
import { forgotPassword, verifyOTPController, resetPassword } from './passwordReset.controller.js';
import { registerRateLimiter, loginRateLimiter, passwordResetRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Test endpoint — disabled in production
if (process.env.NODE_ENV !== 'production') {
    router.get('/test', (req, res) => {
        res.json({ message: 'Backend connection successful!', timestamp: new Date() });
    });
}

// Apply rate limiting
router.post('/register', registerRateLimiter, registerUser);
router.post('/login', loginRateLimiter, loginUser);

router.get('/verify-email', verifyEmail);

// Email verification by OTP
router.post('/send-email-otp', sendEmailOTP);
router.post('/verify-email-otp', verifyEmailOTP);

// Password reset endpoints
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/verify-otp', passwordResetRateLimiter, verifyOTPController);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);

export default router;
