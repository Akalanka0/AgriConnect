import Crop from '../models/Crop.js';
import sequelize from '../config/db.js';

const seedCrops = async () => {
    try {
        console.log('🌱 Starting crops seeder...');

        // Crop data — ignoreDuplicates makes this safe to re-run
        const crops = [
            { name: 'Paddy' },
            { name: 'Maize' },
            { name: 'Chilli' },
            { name: 'Big Onion' },
            { name: 'Soya Bean' },
            { name: 'Finger Millet' }
        ];

        // Insert — skips rows that already exist (ON CONFLICT DO NOTHING)
        await Crop.bulkCreate(crops, { ignoreDuplicates: true });
        console.log(`✅ Seeded ${crops.length} crops:`);
        crops.forEach(crop => console.log(`   - ${crop.name}`));

    } catch (error) {
        console.error('❌ Error seeding crops:', error);
        throw error;
    }
};

export default seedCrops;
