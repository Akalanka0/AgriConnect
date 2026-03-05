import { InstructorRating, InstructorDetail } from '../models/index.js';

/**
 * Calculate and update instructor's average rating based on all approved ratings
 * @param {string} instructorId - The instructor ID to update rating for
 */
export const updateInstructorAverageRating = async (instructorId) => {
    try {
        const ratings = await InstructorRating.findAll({
            where: { 
                instructor_id: instructorId,
                status: 'approved'
            }
        });

        if (ratings.length === 0) {
            // Update instructor detail with 0 rating
            await InstructorDetail.update(
                { average_rating: 0 },
                { where: { instructor_id: instructorId } }
            );
            return 0;
        }

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = parseFloat((sum / ratings.length).toFixed(1));

        await InstructorDetail.update(
            { average_rating: average },
            { where: { instructor_id: instructorId } }
        );

        return average;
    } catch (error) {
        console.error('Error updating average rating:', error);
        throw error;
    }
};

/**
 * Get instructor rating statistics
 * @param {string} instructorId - The instructor ID
 * @returns {Object} Rating statistics including average, total count, and distribution
 */
export const getInstructorRatingStats = async (instructorId) => {
    try {
        const ratings = await InstructorRating.findAll({
            where: { 
                instructor_id: instructorId,
                status: 'approved'
            }
        });

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

        return {
            total_ratings: totalRatings,
            average_rating: parseFloat(averageRating.toFixed(1)),
            rating_distribution: ratingDistribution
        };
    } catch (error) {
        console.error('Error getting instructor rating stats:', error);
        throw error;
    }
};
