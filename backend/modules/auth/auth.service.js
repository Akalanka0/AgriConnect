import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sequelize, User, FarmerDetail, InstructorDetail, SystemSetting } from '../../models/index.js';
import { sendVerificationEmail } from '../../services/emailService.js';

/**
 * Register a new user (farmer or instructor only)
 * Admin role is blocked from public registration
 */
export const registerUser = async (userData) => {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
        // Check for Maintenance Mode
        const maintenanceSetting = await SystemSetting.findOne({
            where: { setting_key: 'maintenance_mode' },
            transaction
        });

        if (maintenanceSetting && maintenanceSetting.setting_value === 'true') {
            throw new Error('MAINTENANCE_MODE: System is currently under maintenance. Registration is temporarily disabled.');
        }

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

        // Allow reuse of specific demo NICs
        const isDemoNIC = ['123456789V', '987654321V'].includes(userData.nic);

        if (existingNIC && !isDemoNIC) {
            throw new Error('NIC_EXISTS: NIC already registered');
        } else if (existingNIC && isDemoNIC) {
            // If it's a demo NIC, we need to handle it.
            // Since NIC is unique in the DB (likely), we might have a constraint issue if we just proceed to create.
            // If the user with this NIC is the SAME as the one we are re-registering (by email), it was handled above by destroying the user.
            // But if another user has this NIC, we have a problem.
            
            // However, the logic at the top deletes the user if the EMAIL matches the demo email.
            // If the user is trying to register with a DIFFERENT email but the DEMO NIC, we should probably block it or handle it.
            // But based on the request "reuse 123456789V", we assume it's for the demo flow.
            
            // The constraint on the DB for NIC needs to be respected.
            // If we are here, it means a user exists with this NIC.
            // If that user was NOT deleted (because email didn't match), we can't create a new user with the same NIC due to DB unique constraint.
            
            // So we must delete the OLD user who has this NIC to free it up, 
            // OR we assume the "delete old user by email" above already cleared it if it was the same user.
            
            // If existingNIC is not null here, it means there is a user with this NIC.
            // We should destroy that user to allow reuse of the NIC, similar to how we destroy by email.
             await existingNIC.destroy({ transaction });
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
            let farmerDetail = await FarmerDetail.findOne({
                where: { farmer_id: userData.farmer_id },
                transaction
            });

            // If not found, check in GeneratedId table
            if (!farmerDetail) {
                const generatedId = await GeneratedId.findOne({
                    where: { 
                        code: userData.farmer_id,
                        type: 'farmer'
                    },
                    transaction
                });

                if (generatedId) {
                    // Create the farmer detail record since the ID is valid but not yet in FarmerDetail
                    farmerDetail = await FarmerDetail.create({
                        farmer_id: userData.farmer_id,
                        user_id: user.id
                    }, { transaction });

                    // Mark generated ID as used
                    await generatedId.update({ status: 'used' }, { transaction });
                } else {
                    throw new Error('INVALID_FARMER_ID: Farmer ID not found');
                }
            } else {
                // Check if assigned (but allow demo IDs to be reassigned)
                if (farmerDetail.user_id) {
                    const isDemoFarmerId = userData.farmer_id.trim() === 'FARM-2026-DEMO' || 
                                         userData.farmer_id.trim() === 'FARM-2025-0001' || 
                                         userData.farmer_id.trim() === 'F-TEST-001';
                    
                    if (isDemoFarmerId) {
                        // It's fine, we will overwrite the user_id below.
                    } else {
                        throw new Error(`FARMER_ID_ASSIGNED: Farmer ID ${userData.farmer_id} is already assigned to a user`);
                    }
                }

                // Assign the user to the farmer detail
                await farmerDetail.update({ user_id: user.id }, { transaction });
            }
        } else if (userData.role === 'instructor') {
            // Validate instructor-specific fields
            if (!userData.instructor_id) {
                throw new Error('Instructor ID is required');
            }

            // Check if instructor_id already exists
            let instructorDetail = await InstructorDetail.findOne({
                where: { instructor_id: userData.instructor_id },
                transaction
            });

            if (instructorDetail.user_id) {
                // If it's the specific demo ID, we allow reassignment
                const isDemoInstructorId = userData.instructor_id.trim() === 'INST-2026-0001' || 
                                         userData.instructor_id.trim() === 'INST-2025-0001' ||
                                         userData.instructor_id.trim() === 'I-TEST-001';
                
                if (isDemoInstructorId) {
                    // Update the existing record to point to the new user
                    await instructorDetail.update({ user_id: user.id }, { transaction });
                } else {
                    throw new Error(`INSTRUCTOR_ID_EXISTS: Instructor ID ${userData.instructor_id} already exists`);
                }
            } else {
                // Check in GeneratedId table
                const generatedId = await GeneratedId.findOne({
                    where: { 
                        code: userData.instructor_id,
                        type: 'instructor'
                    },
                    transaction
                });

                if (generatedId) {
                    // Create the instructor detail record
                    await InstructorDetail.create({
                        user_id: user.id,
                        instructor_id: userData.instructor_id
                    }, { transaction });

                    // Mark generated ID as used
                    await generatedId.update({ status: 'used' }, { transaction });
                } else {
                    // If not in GeneratedId and not in InstructorDetail, create it (fallback for custom IDs if allowed)
                    await InstructorDetail.create({
                        user_id: user.id,
                        instructor_id: userData.instructor_id
                    }, { transaction });
                }
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

        // Check for Maintenance Mode (Allow Admins only)
        if (user.role !== 'admin' && user.role !== 'Super Admin') {
            const maintenanceSetting = await SystemSetting.findOne({
                where: { setting_key: 'maintenance_mode' }
            });

            if (maintenanceSetting && maintenanceSetting.setting_value === 'true') {
                throw new Error('MAINTENANCE_MODE: System is currently under maintenance. Please try again later.');
            }
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
            status: user.status,
            profile_picture: user.profile_picture,
            avatar: user.avatar
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
