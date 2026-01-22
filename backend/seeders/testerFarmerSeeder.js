import { FarmerDetail } from '../models/index.js';

const seedTesterFarmer = async () => {
    try {
        const [farmer, created] = await FarmerDetail.findOrCreate({
            where: { farmer_id: 'F-TEST-001' },
            defaults: {
                farmer_id: 'F-TEST-001',
                user_id: null // Ensure it is unassigned on creation
            }
        });

        if (created) {
            console.log('🌱 Seeded Tester Farmer ID: F-TEST-001');
        } else {
            // If it already exists, ensure it is unassigned for the next test run
            if (farmer.user_id !== null) {
                await farmer.update({ user_id: null });
                console.log('🔄 Reset Tester Farmer ID F-TEST-001 to be unassigned.');
            } else {
                console.log('👍 Tester Farmer ID F-TEST-001 is already available.');
            }
        }
    } catch (error) {
        console.error('❌ Error seeding tester farmer ID:', error);
    }
};

export default seedTesterFarmer;
