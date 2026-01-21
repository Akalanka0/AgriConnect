import { FarmerDetail } from '../models/index.js';
import { faker } from '@faker-js/faker';

const generateMockFarmerId = (index) => {
    const year = new Date().getFullYear();
    const paddedIndex = String(index).padStart(4, '0');
    return `FARM-${year}-${paddedIndex}`;
};

const seedFarmers = async () => {
    try {
        const farmers = [];
        for (let i = 1; i <= 10; i++) {
            farmers.push({
                farmer_id: generateMockFarmerId(i),
                user_id: null,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        await FarmerDetail.bulkCreate(farmers, {
            ignoreDuplicates: true,
        });

        console.log('✅ Farmer details seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding farmer details:', error);
    }
};

export default seedFarmers;
