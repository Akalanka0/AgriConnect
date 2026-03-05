import { InstructorRating, InstructorDetail, FarmerDetail, User } from '../../models/index.js';
import { updateInstructorAverageRating, getInstructorRatingStats } from '../../services/ratingService.js';

// Submit instructor rating from farmer
export const submitInstructorRating = async (req, res) => {
    try {
        const { instructor_id, rating, comments } = req.body;
        const farmerId = req.user.farmerDetail?.farmer_id;
        const farmerName = req.user.full_name;

        if (!farmerId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Farmer profile not found' } 
            });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Rating must be between 1 and 5' } 
            });
        }

        // Check if instructor exists
        const instructor = await InstructorDetail.findOne({
            where: { instructor_id }
        });

        if (!instructor) {
            return res.status(404).json({ 
                success: false, 
                error: { message: 'Instructor not found' } 
            });
        }

        // Check if farmer has already rated this instructor
        const existingRating = await InstructorRating.findOne({
            where: { 
                instructor_id, 
                farmer_id: farmerId 
            }
        });

        let ratingRecord;
        if (existingRating) {
            // Update existing rating
            ratingRecord = await existingRating.update({
                rating,
                comments,
                status: 'approved',
                updated_at: new Date()
            });
        } else {
            // Create new rating
            ratingRecord = await InstructorRating.create({
                instructor_id,
                farmer_id: farmerId,
                farmer_name: farmerName,
                rating,
                comments,
                status: 'approved'
            });
        }

        // Update instructor's average rating
        await updateInstructorAverageRating(instructor_id);

        res.status(201).json({
            success: true,
            message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
            data: ratingRecord
        });

    } catch (error) {
        console.error('Error submitting instructor rating:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to submit rating' } 
        });
    }
};

// Get all ratings for an instructor
export const getInstructorRatings = async (req, res) => {
    try {
        const { instructor_id } = req.params;

        // Verify instructor exists
        const instructor = await InstructorDetail.findOne({
            where: { instructor_id }
        });

        if (!instructor) {
            return res.status(404).json({ 
                success: false, 
                error: { message: 'Instructor not found' } 
            });
        }

        // Get all approved ratings for this instructor
        const ratings = await InstructorRating.findAll({
            where: { 
                instructor_id,
                status: 'approved'
            },
            include: [
                {
                    model: FarmerDetail,
                    as: 'farmer',
                    attributes: ['farmer_id', 'district', 'zone']
                },
                {
                    model: User,
                    as: 'farmerUser',
                    attributes: ['email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calculate statistics
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
            : 0;

        // Group ratings by star count
        const ratingDistribution = {
            5: ratings.filter(r => r.rating === 5).length,
            4: ratings.filter(r => r.rating === 4).length,
            3: ratings.filter(r => r.rating === 3).length,
            2: ratings.filter(r => r.rating === 2).length,
            1: ratings.filter(r => r.rating === 1).length
        };

        res.status(200).json({
            success: true,
            data: {
                instructor_id,
                instructor_name: instructor.user?.full_name || 'Unknown',
                total_ratings: totalRatings,
                average_rating: parseFloat(averageRating.toFixed(1)),
                rating_distribution: ratingDistribution,
                ratings: ratings.map(rating => ({
                    id: rating.id,
                    farmer_name: rating.farmer_name || 'Anonymous Farmer',
                    farmer_id: rating.farmer_id,
                    farmer_district: rating.farmer?.district,
                    farmer_zone: rating.farmer?.zone,
                    rating: rating.rating,
                    comments: rating.comments,
                    created_at: rating.created_at
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching instructor ratings:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to fetch ratings' } 
        });
    }
};

/**
 * Delete Instructor Rating
 */
export const deleteInstructorRating = async (req, res) => {
    try {
        const { instructor_id } = req.body; // Usually passed in body or params
        const farmerId = req.user.farmerDetail?.farmer_id;

        if (!farmerId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Farmer profile not found' } 
            });
        }

        const rating = await InstructorRating.findOne({
            where: {
                instructor_id,
                farmer_id: farmerId
            }
        });

        if (!rating) {
            return res.status(404).json({
                success: false,
                error: { message: 'Rating not found' }
            });
        }

        await rating.destroy();
        
        // Update instructor average rating
        await updateInstructorAverageRating(instructor_id);

        return res.status(200).json({
            success: true,
            message: 'Rating deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting instructor rating:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to delete rating' }
        });
    }
};

/**
 * Get My Ratings (Farmer's ratings)
 */
export const getMyRatings = async (req, res) => {
    try {
        const farmerId = req.user.farmerDetail?.farmer_id;

        if (!farmerId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Farmer profile not found' } 
            });
        }

        const ratings = await InstructorRating.findAll({
            where: { farmer_id: farmerId },
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: ratings
        });

    } catch (error) {
        console.error('Error fetching my ratings:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch your ratings' }
        });
    }
};

// Get rating summary for instructor dashboard
export const getInstructorRatingSummary = async (req, res) => {
    try {
        const instructorId = req.user.instructorDetail?.instructor_id;

        if (!instructorId) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Instructor profile not found' } 
            });
        }

        // Get ratings with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: ratings } = await InstructorRating.findAndCountAll({
            where: { 
                instructor_id: instructorId,
                status: 'approved'
            },
            include: [
                {
                    model: FarmerDetail,
                    as: 'farmer',
                    attributes: ['farmer_id', 'district', 'zone']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Calculate statistics
        const averageRating = count > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
            : 0;

        res.status(200).json({
            success: true,
            data: {
                total_ratings: count,
                average_rating: parseFloat(averageRating.toFixed(1)),
                current_page: page,
                total_pages: Math.ceil(count / limit),
                ratings: ratings.map(rating => ({
                    id: rating.id,
                    farmer_name: rating.farmer_name || 'Anonymous Farmer',
                    farmer_id: rating.farmer_id,
                    farmer_district: rating.farmer?.district,
                    farmer_zone: rating.farmer?.zone,
                    rating: rating.rating,
                    comments: rating.comments,
                    created_at: rating.created_at
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching instructor rating summary:', error);
        res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to fetch rating summary' } 
        });
    }
};
