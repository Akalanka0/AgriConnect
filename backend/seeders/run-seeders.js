import seedAdmin from './admin.seeder.js';
import seedCrops from './crops.seeder.js';
import sequelize from '../config/db.js';

// ─── Production seeder runner ─────────────────────────────────────────────────
// Seeds only the data required for a real deployment:
//   1. admin user + system settings
//   2. crop reference catalogue
//
// For demo/testing accounts (instructor + farmer), run separately:
//   npm run seed:demo
// ─────────────────────────────────────────────────────────────────────────────

const runSeeders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        await seedAdmin();   // 1. admin user + system settings
        await seedCrops();   // 2. crop reference data

        console.log('🎉 All seeders ran successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();
