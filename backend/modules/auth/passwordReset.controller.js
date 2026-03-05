import { User } from '../../models/index.js';
import { generateOTP, storeOTP, verifyOTP } from './passwordReset.service.js';
import { sendPasswordResetEmail } from '../../services/emailService.js';

/**
 * Send password reset email with OTP
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_EMAIL',
                    message: 'Email is required'
                }
            });
        }

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user) {
            // For security, don't reveal if email exists or not
            return res.json({
                success: true,
                message: 'If an account with this email exists, a reset code has been sent.'
            });
        }

        // Generate and store OTP
        const otp = generateOTP();
        storeOTP(email, otp);

        try {
            await sendPasswordResetEmail(user.email, otp, user.full_name || 'User');
        } catch (emailError) {
            console.error('Password reset email send failed:', emailError);
        }

        return res.json({
            success: true,
            message: 'Password reset code sent to your email',
            // For development only, remove in production
            devInfo: process.env.NODE_ENV === 'development' ? { otp } : undefined
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while processing your request'
            }
        });
    }
};

/**
 * Verify OTP for password reset
 * POST /api/auth/verify-otp
 */
export const verifyOTPController = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email and OTP are required'
                }
            });
        }

        // Verify OTP (peek mode - don't consume yet)
        const verification = verifyOTP(email, otp, false);

        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OTP_INVALID',
                    message: verification.message
                }
            });
        }

        return res.json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while verifying OTP'
            }
        });
    }
};

/**
 * Reset password with OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email, OTP, and new password are required'
                }
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK_PASSWORD',
                    message: 'Password must be at least 8 characters long'
                }
            });
        }

        // Verify OTP first (consume mode - delete after use)
        const verification = verifyOTP(email, otp, true);
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OTP_INVALID',
                    message: verification.message
                }
            });
        }

        // Find user
        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Hash new password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await user.update({ password: hashedPassword });

        return res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while resetting password'
            }
        });
    }
};
