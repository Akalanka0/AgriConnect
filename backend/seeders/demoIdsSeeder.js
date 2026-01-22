import { FarmerDetail } from '../models/index.js';

const seedDemoIds = async () => {
    try {
        const demoFarmerId = 'DEMO-FARM-2026-0001';
        
        const [farmer, created] = await FarmerDetail.findOrCreate({
            where: { farmer_id: demoFarmerId },
            defaults: {
                farmer_id: demoFarmerId,
                user_id: null // Ensure it is unassigned on creation
            }
        });

        if (created) {
            console.log(`🌱 Seeded Demo Farmer ID: ${demoFarmerId}`);
        } else {
            // If it exists, we don't necessarily need to reset it here, 
            // as the auth service will handle "stealing" it. 
            // But checking if it exists is good.
            console.log(`👍 Demo Farmer ID ${demoFarmerId} exists.`);
        }
    } catch (error) {
        console.error('❌ Error seeding demo IDs:', error);
    }
};

export default seedDemoIds;
