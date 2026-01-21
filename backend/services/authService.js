import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize, User, FarmerDetail, InstructorDetail } from '../models/index.js';

/**
 * Register a new user (farmer or instructor only)
 * Admin role is blocked from public registration
 */
export const registerUser = async (userData) => {
    const transaction = await sequelize.transaction();

    try {
        // Security: Block admin role registration
        if (userData.role === 'admin') {
            throw new Error('FORBIDDEN: Admin role cannot be registered through public endpoint');
        }

        // Validate role is farmer or instructor
        if (!['farmer', 'instructor'].includes(userData.role)) {
            throw new Error('Invalid role. Must be farmer or instructor');
        }

        // Check if email already exists
        const existingUser = await User.findOne({
            where: { email: userData.email },
            transaction
        });

        if (existingUser) {
            throw new Error('EMAIL_EXISTS: Email already registered');
        }

        // Check if NIC already exists
        const existingNIC = await User.findOne({
            where: { nic: userData.nic },
            transaction
        });

        if (existingNIC) {
            throw new Error('NIC_EXISTS: NIC already registered');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const user = await User.create({
            full_name: userData.full_name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            nic: userData.nic,
            phone: userData.phone,
            status: 'active'
        }, { transaction });

        // Create role-specific details based on role
        if (userData.role === 'farmer') {
            // Validate farmer-specific fields
            if (!userData.farmer_id) {
                throw new Error('Farmer ID is required');
            }

            // Check if farmer_id exists and is unassigned
            const farmerDetail = await FarmerDetail.findOne({
                where: { farmer_id: userData.farmer_id },
                transaction
            });

            if (!farmerDetail) {
                throw new Error('INVALID_FARMER_ID: Farmer ID not found');
            }

            if (farmerDetail.user_id) {
                throw new Error('FARMER_ID_ASSIGNED: Farmer ID is already assigned to a user');
            }

            // Assign the user to the farmer detail
            await farmerDetail.update({ user_id: user.id }, { transaction });
        } else if (userData.role === 'instructor') {
            // Validate instructor-specific fields
            if (!userData.instructor_id) {
                throw new Error('Instructor ID is required');
            }

            // Check if instructor_id already exists
            const existingInstructorId = await InstructorDetail.findOne({
                where: { instructor_id: userData.instructor_id },
                transaction
            });

            if (existingInstructorId) {
                throw new Error('Instructor ID already exists');
            }

            await InstructorDetail.create({
                user_id: user.id,
                instructor_id: userData.instructor_id
            }, { transaction });
        }

        // Commit transaction
        await transaction.commit();

        // Return user data (without password)
        const userResponse = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            nic: user.nic,
            phone: user.phone,
            status: user.status,
            created_at: user.created_at
        };

        return {
            success: true,
            user: userResponse,
            message: 'User registered successfully'
        };
    } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();

        // Re-throw error to be handled by controller
        throw error;
    }
};

/**
 * Login user and generate JWT token
 */
export const loginUser = async (email, password) => {
    try {
        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() },
            include: [
                {
                    model: FarmerDetail,
                    as: 'farmerDetail',
                    required: false
                },
                {
                    model: InstructorDetail,
                    as: 'instructorDetail',
                    required: false
                }
            ]
        });

        // Check if user exists
        if (!user) {
            throw new Error('INVALID_CREDENTIALS: Invalid email or password');
        }

        // Check if account is active
        if (user.status !== 'active') {
            throw new Error(`ACCOUNT_${user.status.toUpperCase()}: Account is ${user.status}`);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS: Invalid email or password');
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpire = process.env.JWT_EXPIRE || '7d';

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: jwtExpire
            }
        );

        // Prepare user response (without password)
        const userResponse = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            nic: user.nic,
            phone: user.phone,
            status: user.status
        };

        // Add role-specific data
        if (user.role === 'farmer' && user.farmerDetail) {
            userResponse.farmer_id = user.farmerDetail.farmer_id;
        } else if (user.role === 'instructor' && user.instructorDetail) {
            userResponse.instructor_id = user.instructorDetail.instructor_id;
        }

        return {
            success: true,
            token,
            user: userResponse,
            message: 'Login successful'
        };
    } catch (error) {
        // Re-throw error to be handled by controller
        throw error;
    }
};

/**
 * Get user by ID (for protected routes)
 */
export const getUserById = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: FarmerDetail,
                    as: 'farmerDetail',
                    required: false
                },
                {
                    model: InstructorDetail,
                    as: 'instructorDetail',
                    required: false
                }
            ]
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND: User not found');
        }

        return user;
    } catch (error) {
        throw error;
    }
};
