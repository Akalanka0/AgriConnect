import crypto from 'crypto';

// In-memory OTP store (use Redis for production)
const otpStore = new Map();

/**
 * Generate a 4-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Store OTP with expiration
 */
export const storeOTP = (email, otp) => {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email.toLowerCase(), { otp, expiresAt });
    
    // Clean up expired OTPs periodically
    setTimeout(() => {
        otpStore.delete(email.toLowerCase());
    }, 10 * 60 * 1000);
};

/**
 * Verify OTP
 */
export const verifyOTP = (email, providedOTP) => {
    const storedData = otpStore.get(email.toLowerCase());
    
    if (!storedData) {
        return { valid: false, message: 'OTP not found or expired' };
    }
    
    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return { valid: false, message: 'OTP expired' };
    }
    
    if (storedData.otp !== providedOTP) {
        return { valid: false, message: 'Invalid OTP' };
    }
    
    // OTP is valid, remove it from store
    otpStore.delete(email.toLowerCase());
    return { valid: true, message: 'OTP verified successfully' };
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Clean up expired OTPs
 */
export const cleanupExpiredOTPs = () => {
    const now = Date.now();
    for (const [email, data] of otpStore.entries()) {
        if (now > data.expiresAt) {
            otpStore.delete(email);
        }
    }
};
