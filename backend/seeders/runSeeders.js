import seedAdmin from './adminSeeder.js';
import seedFarmers from './farmerSeeder.js';
import seedTesterFarmer from './testerFarmerSeeder.js';
import seedDemoIds from './demoIdsSeeder.js';
import seedDemoAccounts from './demoAccountsSeeder.js';
import sequelize from '../config/db.js';

const runSeeders = async () => {
    try {
        await sequelize.sync();
        console.log('✅ Database synchronized');

        await seedAdmin();
        await seedFarmers();
        await seedTesterFarmer();
        await seedDemoIds();
        await seedDemoAccounts();

        console.log('🎉 All seeders ran successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();
