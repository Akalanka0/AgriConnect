import rateLimit from 'express-rate-limit';

/**
 * Rate limiters using express-rate-limit
 * standardHeaders: true  — sends RateLimit-* headers per the IETF draft
 * legacyHeaders: false   — suppresses deprecated X-RateLimit-* headers
 */

/**
 * Login rate limiter — 10 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please wait a moment and try again.'
        }
    }
});

/**
 * Registration rate limiter — 10 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many registration attempts. Please wait before trying again.'
        }
    }
});

/**
 * Password reset rate limiter — 5 requests per 15 minutes per IP
 * Covers /forgot-password, /verify-otp, and /reset-password to prevent OTP brute-force
 */
export const passwordResetRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts. Please wait 15 minutes and try again.'
        }
    }
});
