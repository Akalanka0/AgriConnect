import { CropPlan, PestReport, Activity, HarvestRecord } from '../models/index.js';
import sequelize from '../config/db.js';

/**
 * Shared data service for common agricultural operations
 * This reduces cross-module dependencies by centralizing common functionality
 */
export class DataService {
    /**
     * Get farmer's agricultural data summary
     */
    static async getFarmerDataSummary(farmerId) {
        const [
            cropPlansCount,
            pestReportsCount,
            activitiesCount,
            harvestRecordsCount
        ] = await Promise.all([
            CropPlan.count({ where: { user_id: farmerId } }),
            PestReport.count({ where: { user_id: farmerId } }),
            Activity.count({ where: { user_id: farmerId } }),
            HarvestRecord.count({ where: { user_id: farmerId } })
        ]);

        return {
            activeCrops: cropPlansCount,
            pestIssues: pestReportsCount,
            activitiesLogged: activitiesCount,
            harvestRecords: harvestRecordsCount
        };
    }

    /**
     * Get recent activity for dashboard
     */
    static async getRecentActivity(farmerId, limit = 10) {
        const recentCropPlans = await CropPlan.findAll({
            where: { user_id: farmerId },
            limit: 3,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'crop_name', 'status', 'created_at']
        });

        const recentPestReports = await PestReport.findAll({
            where: { user_id: farmerId },
            limit: 3,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'pest_type', 'severity', 'status', 'created_at']
        });

        const recentActivities = await Activity.findAll({
            where: { user_id: farmerId },
            limit: 3,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'activity_type', 'description', 'created_at']
        });

        const recentHarvests = await HarvestRecord.findAll({
            where: { user_id: farmerId },
            limit: 3,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'crop_type', 'quantity', 'unit', 'created_at']
        });

        return {
            cropPlans: recentCropPlans,
            pestReports: recentPestReports,
            activities: recentActivities,
            harvests: recentHarvests
        };
    }

    /**
     * Get data for instructor dashboard
     */
    static async getInstructorDataSummary(instructorId) {
        const [
            assignedCropPlans,
            assignedPestReports,
            totalFarmers
        ] = await Promise.all([
            CropPlan.count({ where: { instructor_id: instructorId } }),
            PestReport.count({ where: { instructor_id: instructorId } }),
            sequelize.query(`
                SELECT COUNT(DISTINCT u.id) as count
                FROM Users u
                JOIN FarmerDetails fd ON u.id = fd.user_id
                WHERE u.is_active = true
                AND fd.region IN (
                    SELECT DISTINCT region 
                    FROM InstructorDetails 
                    WHERE user_id = ?
                )
            `, {
                replacements: [instructorId],
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        return {
            assignedCropPlans: assignedCropPlans,
            assignedPestReports: assignedPestReports,
            totalFarmers: totalFarmers[0]?.count || 0
        };
    }

    /**
     * Get regional statistics
     */
    static async getRegionalStatistics(region) {
        const [
            farmerCount,
            cropPlanCount,
            pestReportCount
        ] = await Promise.all([
            sequelize.query(`
                SELECT COUNT(*) as count
                FROM Users u
                JOIN FarmerDetails fd ON u.id = fd.user_id
                WHERE u.is_active = true 
                AND fd.region = ?
            `, {
                replacements: [region],
                type: sequelize.QueryTypes.SELECT
            }),
            CropPlan.count({
                include: [{
                    model: sequelize.models.User,
                    as: 'user',
                    include: [{
                        model: sequelize.models.FarmerDetail,
                        as: 'farmerDetail',
                        where: { region }
                    }]
                }]
            }),
            PestReport.count({
                include: [{
                    model: sequelize.models.User,
                    as: 'user',
                    include: [{
                        model: sequelize.models.FarmerDetail,
                        as: 'farmerDetail',
                        where: { region }
                    }]
                }]
            })
        ]);

        return {
            farmerCount: farmerCount[0]?.count || 0,
            cropPlanCount,
            pestReportCount
        };
    }

    /**
     * Get activity trends
     */
    static async getActivityTrends(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [cropPlans, pestReports, activities] = await Promise.all([
            CropPlan.findAll({
                where: {
                    created_at: { [sequelize.Sequelize.Op.gte]: startDate }
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            }),
            PestReport.findAll({
                where: {
                    created_at: { [sequelize.Sequelize.Op.gte]: startDate }
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            }),
            Activity.findAll({
                where: {
                    created_at: { [sequelize.Sequelize.Op.gte]: startDate }
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            })
        ]);

        return {
            cropPlans: cropPlans.map(item => ({ date: item.dataValues.date, count: item.dataValues.count })),
            pestReports: pestReports.map(item => ({ date: item.dataValues.date, count: item.dataValues.count })),
            activities: activities.map(item => ({ date: item.dataValues.date, count: item.dataValues.count }))
        };
    }
}

export default DataService;
