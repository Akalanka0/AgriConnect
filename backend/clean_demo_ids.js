import { FarmerDetail, InstructorDetail, sequelize } from './models/index.js';
import { Op } from 'sequelize';

const cleanOldDemoIds = async () => {
    try {
        console.log('Cleaning up old demo IDs...');
        
        // Delete all Farmer IDs starting with FARM-2026
        const deletedFarmers = await FarmerDetail.destroy({
            where: { 
                farmer_id: {
                    [Op.like]: 'FARM-2026-%'
                }
            }
        });
        console.log(`Deleted ${deletedFarmers} records for FARM-2026-%`);

        // Delete old Instructor ID (if any)
        const oldInstructorId = 'INST-2026-00001';
        const deletedInstructor = await InstructorDetail.destroy({
            where: { instructor_id: oldInstructorId }
        });
        console.log(`Deleted ${deletedInstructor} records for ${oldInstructorId}`);

    } catch (error) {
        console.error('Error cleaning old demo IDs:', error);
    } finally {
        await sequelize.close();
    }
};

cleanOldDemoIds();
