import { FarmerDetail, InstructorDetail } from '../models/index.js';

const seedDemoIds = async () => {
    try {
        const demoFarmerId = 'FARM-2025-0001';
        
        const [farmer, createdFarmer] = await FarmerDetail.findOrCreate({
            where: { farmer_id: demoFarmerId },
            defaults: {
                farmer_id: demoFarmerId,
                user_id: null // Ensure it is unassigned on creation
            }
        });

        if (createdFarmer) {
            console.log(`🌱 Seeded Demo Farmer ID: ${demoFarmerId}`);
        } else {
            console.log(`👍 Demo Farmer ID ${demoFarmerId} exists.`);
        }

        const demoInstructorId = 'INST-2026-0001';
        
        const [instructor, createdInstructor] = await InstructorDetail.findOrCreate({
            where: { instructor_id: demoInstructorId },
            defaults: {
                instructor_id: demoInstructorId,
                user_id: null, // Ensure it is unassigned on creation
                district: 'Anuradhapura',
                zone: 'Demo Zone'
            }
        });

        if (createdInstructor) {
            console.log(`🌱 Seeded Demo Instructor ID: ${demoInstructorId}`);
        } else {
            console.log(`👍 Demo Instructor ID ${demoInstructorId} exists.`);
        }

    } catch (error) {
        console.error('❌ Error seeding demo IDs:', error);
    }
};

export default seedDemoIds;
