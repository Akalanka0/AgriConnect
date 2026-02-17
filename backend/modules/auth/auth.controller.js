import crypto from 'crypto';
import { registerUser, loginUser } from './auth.service.js';
import { sendVerificationEmail } from '../../services/emailService.js';
import { User } from '../../models/index.js';

/**
 * Register a new user (farmer or instructor)
 * POST /api/auth/register
 */
export const registerUserController = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            role,
            nic,
            phone,
            farmer_id,
            instructor_id,
        } = req.body;

        // Basic validation
        if (!full_name || !email || !password || !role || !nic || !phone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Missing required fields',
                    details: {
                        required: ['full_name', 'email', 'password', 'role', 'nic', 'phone']
                    }
                }
            });
        }

        // Prepare user data
        const userData = {
            full_name: full_name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role.toLowerCase().trim(),
            nic: nic.trim().toUpperCase(),
            phone: phone.trim()
        };

        // Add role-specific data
        if (role.toLowerCase() === 'farmer') {
            if (!farmer_id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Farmer registration requires farmer_id',
                        details: {
                            required: ['farmer_id']
                        }
                    }
                });
            }
            userData.farmer_id = farmer_id.trim();
        } else if (role.toLowerCase() === 'instructor') {
            if (!instructor_id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Instructor registration requires instructor_id',
                        details: {
                            required: ['instructor_id']
                        }
                    }
                });
            }
            userData.instructor_id = instructor_id.trim();
        }

        // Call service layer
        const result = await registerUser(userData);

        // Return success response
        return res.status(201).json(result);
    } catch (error) {
        // Handle specific error types
        if (error.message.includes('FORBIDDEN')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin role cannot be registered through public endpoint'
                }
            });
        }

        if (error.message.includes('EMAIL_EXISTS')) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Email already registered'
                }
            });
        }

        if (error.message.includes('NIC_EXISTS')) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'NIC_EXISTS',
                    message: 'NIC already registered'
                }
            });
        }

        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => ({
                field: err.path,
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validationErrors.length > 0 ? validationErrors[0].message : 'Validation failed',
                    details: validationErrors
                }
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: error.errors && error.errors.length > 0 ? error.errors[0].message : (error.message || 'Duplicate entry. This record already exists')
                }
            });
        }

        // Generic error handler
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'An error occurred during registration'
            }
        });
    }
};

export const sendEmailOTPController = async (req, res) => {
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

        const normalizedEmail = email.toLowerCase().trim();
        const isDemoEmail = normalizedEmail === process.env.DEV_EMAIL_BYPASS;
        
        let user;
        if (isDemoEmail) {
            // Find the most recently created user for the demo email
            user = await User.findOne({ 
                where: { email: normalizedEmail },
                order: [['created_at', 'DESC']]
            });
        } else {
            user = await User.findOne({ where: { email: normalizedEmail } });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // For demo accounts, always allow OTP verification (for testing multiple registrations)
        if (!isDemoEmail && user.email_verified) {
            return res.status(200).json({
                success: true,
                message: 'Email already verified'
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await user.update({
            verification_token: otp,
            verification_token_expires: otpExpires
        });

        // For demo email, send OTP to the original email address
        if (isDemoEmail) {
            try {
                await sendVerificationEmail(normalizedEmail, otp, user.full_name || 'Demo User');
                return res.status(200).json({
                    success: true,
                    message: 'Verification code sent to your email',
                    demo: true
                });
            } catch (emailError) {
                console.error('Demo email send failed:', emailError);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: 'EMAIL_SEND_FAILED',
                        message: 'Failed to send verification email. Please try again.'
                    }
                });
            }
        }

        await sendVerificationEmail(user.email, otp, user.full_name || 'User');

        return res.status(200).json({
            success: true,
            message: 'Verification code sent to your email'
        });
    } catch (error) {
        console.error('Send email OTP error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while sending verification code'
            }
        });
    }
};

export const verifyEmailOTPController = async (req, res) => {
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

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        if (user.email_verified) {
            return res.status(200).json({
                success: true,
                message: 'Email already verified'
            });
        }

        if (!user.verification_token || !user.verification_token_expires) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_OTP',
                    message: 'No verification code found. Please request a new code.'
                }
            });
        }

        if (new Date(user.verification_token_expires) < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OTP_EXPIRED',
                    message: 'Verification code has expired'
                }
            });
        }

        if (String(user.verification_token) !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OTP',
                    message: 'Invalid verification code'
                }
            });
        }

        await user.update({
            email_verified: true,
            verification_token: null,
            verification_token_expires: null
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify email OTP error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred during email verification'
            }
        });
    }
};

/**
 * Verify email
 * GET /api/auth/verify-email
 */
export const verifyEmailController = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Verification token is required'
                }
            });
        }

        const user = await User.findOne({ where: { verification_token: token } });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid verification token'
                }
            });
        }

        if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Verification token has expired'
                }
            });
        }

        await user.update({
            email_verified: true,
            verification_token: null,
            verification_token_expires: null
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred during email verification'
            }
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CREDENTIALS',
                    message: 'Email and password are required'
                }
            });
        }

        // Call service layer
        const result = await loginUser(email, password);

        // Return success response
        return res.status(200).json(result);
    } catch (error) {
        // Handle specific error types
        if (error.message.includes('INVALID_CREDENTIALS')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        if (error.message.includes('ACCOUNT_NOT_VERIFIED')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCOUNT_NOT_VERIFIED',
                    message: 'Please verify your email to login.'
                }
            });
        }

        if (error.message.includes('ACCOUNT_')) {
            const status = error.message.split('_')[1].toLowerCase();
            return res.status(403).json({
                success: false,
                error: {
                    code: `ACCOUNT_${status.toUpperCase()}`,
                    message: `Account is ${status}. Please contact administrator.`
                }
            });
        }

        // Generic error handler
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'An error occurred during login'
            }
        });
    }
};

// Export for routes
export {
    registerUserController as registerUser,
    loginUserController as loginUser,
    verifyEmailController as verifyEmail,
    sendEmailOTPController as sendEmailOTP,
    verifyEmailOTPController as verifyEmailOTP
};
