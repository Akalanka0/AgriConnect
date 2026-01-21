import { registerUser, loginUser } from '../services/authService.js';

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
            address
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
            if (!farmer_id || !address) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Farmer registration requires farmer_id and address',
                        details: {
                            required: ['farmer_id', 'address']
                        }
                    }
                });
            }
            userData.farmer_id = farmer_id.trim();
            userData.address = address.trim();
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
                    message: 'Validation failed',
                    details: validationErrors
                }
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: error.message || 'Duplicate entry. This record already exists'
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
export { registerUserController as registerUser, loginUserController as loginUser };
