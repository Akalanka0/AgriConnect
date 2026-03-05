import seedAdmin from './admin.seeder.js';
import seedDemoIds from './demo-ids.seeder.js';
import seedDemoAccounts from './demo-accounts.seeder.js';
import seedCrops from './crops.seeder.js';
import sequelize from '../config/db.js';

const runSeeders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        await seedAdmin();
        await seedDemoIds();
        await seedDemoAccounts();
        await seedCrops();
        console.log('🎉 All seeders ran successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();
