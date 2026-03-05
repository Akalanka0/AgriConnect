import Crop from '../models/Crop.js';
import sequelize from '../config/db.js';

const seedCrops = async () => {
    try {
        console.log('🌱 Starting crops seeder...');

        // Clear existing crops
        await Crop.destroy({ where: {} });
        console.log('🗑️  Cleared existing crops');

        // Crop data
        const crops = [
            {
                name: 'Paddy',
                description: 'Rice is the seed of the grass species Oryza sativa or Oryza glaberrima. As a cereal grain, it is the most widely consumed staple food for a large part of the world\'s human population.',
                scientific_name: 'Oryza sativa',
                variety: 'Long grain',
                growing_season: 'Monsoon',
                harvest_time: 120,
                water_requirements: 'High - requires flooded fields',
                soil_type: 'Clay loam',
                climate_preference: 'Tropical, subtropical',
                category: 'Cereal'
            },
            {
                name: 'Maize',
                description: 'Maize, also known as corn, is a cereal grain first domesticated by indigenous peoples in southern Mexico about 10,000 years ago.',
                scientific_name: 'Zea mays',
                variety: 'Sweet corn',
                growing_season: 'Summer',
                harvest_time: 90,
                water_requirements: 'Moderate',
                soil_type: 'Well-drained loam',
                climate_preference: 'Warm temperate',
                category: 'Cereal'
            },
            {
                name: 'Chilli',
                description: 'Chili peppers are varieties of the berry-fruit of plants from the genus Capsicum, which are members of the nightshade family Solanaceae.',
                scientific_name: 'Capsicum annuum',
                variety: 'Hot pepper',
                growing_season: 'Warm season',
                harvest_time: 75,
                water_requirements: 'Moderate',
                soil_type: 'Sandy loam',
                climate_preference: 'Warm, humid',
                category: 'Vegetable'
            },
            {
                name: 'Big Onion',
                description: 'The onion is a vegetable that is the most widely cultivated species of the genus Allium. Its close relatives include garlic, scallion, leek, and chive.',
                scientific_name: 'Allium cepa',
                variety: 'Large bulb',
                growing_season: 'Cool season',
                harvest_time: 100,
                water_requirements: 'Moderate',
                soil_type: 'Sandy loam',
                climate_preference: 'Temperate',
                category: 'Vegetable'
            },
            {
                name: 'Soya Bean',
                description: 'Soybean is a species of legume native to East Asia, widely grown for its edible bean, which has numerous uses.',
                scientific_name: 'Glycine max',
                variety: 'Edible soybean',
                growing_season: 'Summer',
                harvest_time: 80,
                water_requirements: 'Moderate',
                soil_type: 'Well-drained soil',
                climate_preference: 'Warm temperate',
                category: 'Legume'
            },
            {
                name: 'Finger Millet',
                description: 'Finger millet is an annual herbaceous plant widely grown as a cereal crop in the arid and semiarid areas in Africa and Asia.',
                scientific_name: 'Eleusine coracana',
                variety: 'Ragi',
                growing_season: 'Rainy season',
                harvest_time: 105,
                water_requirements: 'Low to moderate',
                soil_type: 'Red soil, laterite soil',
                climate_preference: 'Arid, semiarid',
                category: 'Millet'
            }
        ];

        // Insert crops
        await Crop.bulkCreate(crops);
        console.log(`✅ Successfully seeded ${crops.length} crops:`);
        crops.forEach(crop => console.log(`   - ${crop.name}`));

    } catch (error) {
        console.error('❌ Error seeding crops:', error);
        throw error;
    }
};

export default seedCrops;
