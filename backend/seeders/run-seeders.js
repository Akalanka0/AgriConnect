import seedAdmin from './admin.seeder.js';
import seedDemoIds from './demo-ids.seeder.js';
import seedDemoAccounts from './demo-accounts.seeder.js';
import seedCrops from './crops.seeder.js';
import sequelize from '../config/db.js';

const runSeeders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        await seedAdmin();        // 1. admin user
        await seedDemoIds();      // 2. pre-populate generated_ids codes
        await seedDemoAccounts(); // 3. demo users + details + system_settings
        await seedCrops();        // 4. crop reference data
        console.log('🎉 All seeders ran successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();
