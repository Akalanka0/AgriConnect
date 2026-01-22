import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sequelize, User, FarmerDetail, InstructorDetail } from '../models/index.js';
import { sendVerificationEmail } from './emailService.js';

/**
 * Register a new user (farmer or instructor only)
 * Admin role is blocked from public registration
 */
export const registerUser = async (userData) => {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
        // Security: Block admin role registration
        if (userData.role === 'admin') {
            throw new Error('FORBIDDEN: Admin role cannot be registered through public endpoint');
        }

        // Validate role is farmer or instructor
        if (!['farmer', 'instructor'].includes(userData.role)) {
            throw new Error('Invalid role. Must be farmer or instructor');
        }

        // Check if email already exists (allow demo email to re-register)
        const isDemoEmail = userData.email === process.env.DEV_EMAIL_BYPASS;
        
        if (isDemoEmail) {
            // If demo email exists, delete the old user to allow re-registration
            const existingUser = await User.findOne({
                where: { email: userData.email },
                transaction
            });
            
            if (existingUser) {
                await existingUser.destroy({ transaction });
            }
        } else {
            const existingUser = await User.findOne({
                where: { email: userData.email },
                transaction
            });

            if (existingUser) {
                throw new Error('EMAIL_EXISTS: Email already registered');
            }
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

        // Determine if the user is the tester
        const isTester = userData.email === process.env.DEV_EMAIL_BYPASS;

        // Demo accounts should still require OTP verification (but OTP will be shown in response)
        const shouldBypassVerification = false;
        const verificationToken = crypto.randomInt(100000, 1000000).toString();
        const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Create user
        const user = await User.create({
            full_name: userData.full_name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            nic: userData.nic,
            phone: userData.phone,
            status: 'active',
            email_verified: shouldBypassVerification,
            verification_token: verificationToken,
            verification_token_expires: verificationTokenExpires
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

            // Check if assigned (but allow DEMO-FARM-2026-0001 to be reassigned)
            if (farmerDetail.user_id) {
                // If it's the specific demo ID, we allow it. The previous owner (if any) will just lose access to this ID.
                const isDemoFarmerId = userData.farmer_id.trim() === 'DEMO-FARM-2026-0001';
                
                if (isDemoFarmerId) {
                    // It's fine, we will overwrite the user_id below.
                } else {
                    throw new Error(`FARMER_ID_ASSIGNED: Farmer ID ${userData.farmer_id} is already assigned to a user`);
                }
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
                // If it's the specific demo ID, we allow reassignment
                const isDemoInstructorId = userData.instructor_id.trim() === 'DEMO-INST-2026-00001';
                
                if (isDemoInstructorId) {
                    // Update the existing record to point to the new user
                    await existingInstructorId.update({ user_id: user.id }, { transaction });
                    
                    // Skip creating a new one since we updated the existing one
                    // We need to return early or structure this to avoid the create call below
                } else {
                    throw new Error(`INSTRUCTOR_ID_EXISTS: Instructor ID ${userData.instructor_id} already exists`);
                }
            } else {
                await InstructorDetail.create({
                    user_id: user.id,
                    instructor_id: userData.instructor_id
                }, { transaction });
            }
        }

        // Commit transaction
        await transaction.commit();
        committed = true;

        if (!shouldBypassVerification && verificationToken) {
            try {
                await sendVerificationEmail(user.email, verificationToken, user.full_name);
            } catch (emailError) {
                console.error('Verification email send failed:', emailError);
            }
        }

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
            message: shouldBypassVerification ? 'User registered successfully' : 'User registered successfully. Please verify your email to login.'
        };
    } catch (error) {
        // Rollback transaction on error
        if (!committed) {
            await transaction.rollback();
        }

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

        // Check if email is verified (phone verification removed)
        if (!user.email_verified) {
            throw new Error('ACCOUNT_NOT_VERIFIED: Please verify your email to login.');
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
