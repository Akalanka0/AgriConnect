import { User, FarmerDetail, InstructorDetail } from '../models/index.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

/**
 * Shared user service for cross-module operations
 * This reduces cross-module dependencies by centralizing user functionality
 */
export class UserService {
    /**
     * Get user by ID with role-specific details
     */
    static async getUserById(userId) {
        const user = await User.findByPk(userId, {
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
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Get users by role with pagination
     */
    static async getUsersByRole(role, options = {}) {
        const { page = 1, limit = 10, search = '' } = options;
        const offset = (page - 1) * limit;

        const whereClause = {
            role: role.toLowerCase()
        };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: role === 'farmer' ? FarmerDetail : InstructorDetail,
                    as: role === 'farmer' ? 'farmerDetail' : 'instructorDetail',
                    required: false
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            users: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Update user profile
     */
    static async updateUserProfile(userId, updateData) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const transaction = await sequelize.transaction();
        
        try {
            // Update basic user info
            if (updateData.full_name || updateData.email || updateData.phone) {
                if (updateData.full_name) user.full_name = updateData.full_name;
                if (updateData.email) user.email = updateData.email.toLowerCase();
                if (updateData.phone) user.phone = updateData.phone;
                await user.save({ transaction });
            }

            // Update role-specific details
            if (user.role === 'farmer' && updateData.farmerDetails) {
                const farmerDetail = await FarmerDetail.findOne({
                    where: { user_id: userId },
                    transaction
                });

                if (farmerDetail) {
                    Object.assign(farmerDetail, updateData.farmerDetails);
                    await farmerDetail.save({ transaction });
                }
            } else if (user.role === 'instructor' && updateData.instructorDetails) {
                const instructorDetail = await InstructorDetail.findOne({
                    where: { user_id: userId },
                    transaction
                });

                if (instructorDetail) {
                    Object.assign(instructorDetail, updateData.instructorDetails);
                    await instructorDetail.save({ transaction });
                }
            }

            await transaction.commit();
            
            // Return updated user with details
            return await this.getUserById(userId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Toggle user active status
     */
    static async toggleUserStatus(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.is_active = !user.is_active;
        await user.save();

        return user;
    }

    /**
     * Get instructors available for assignment
     */
    static async getAvailableInstructors(filters = {}) {
        const whereClause = {
            role: 'instructor',
            status: 'active'
        };

        if (filters.region) {
            whereClause['$instructorDetail.region$'] = filters.region;
        }

        const instructors = await User.findAll({
            where: whereClause,
            include: [
                {
                    model: InstructorDetail,
                    as: 'instructorDetail',
                    required: true
                }
            ],
            order: [['full_name', 'ASC']]
        });

        // Transform data to match frontend expectations
        return instructors.map(instructor => ({
            id: instructor.instructorDetail.instructor_id, // Reference ID (INST-XXXX)
            dbId: instructor.id, // Database ID
            name: instructor.full_name,
            zone: instructor.instructorDetail.zone || 'Not Assigned',
            division: instructor.instructorDetail.assigned_divisions?.[0] || 'Not Assigned',
            assigned_divisions: instructor.instructorDetail.assigned_divisions || [],
            specialization: instructor.instructorDetail.specialization,
            experience: instructor.instructorDetail.experience,
            qualifications: instructor.instructorDetail.qualifications,
            average_rating: instructor.instructorDetail.average_rating,
            email: instructor.email,
            phone: instructor.phone,
            profilePicture: instructor.avatar || instructor.profile_picture || null
        }));
    }

    /**
     * Get farmers by region
     */
    static async getFarmersByRegion(region) {
        return await User.findAll({
            where: {
                role: 'farmer',
                status: 'active'
            },
            include: [
                {
                    model: FarmerDetail,
                    as: 'farmerDetail',
                    required: true,
                    where: {
                        region: region
                    }
                }
            ],
            order: [['full_name', 'ASC']]
        });
    }
}

export default UserService;
