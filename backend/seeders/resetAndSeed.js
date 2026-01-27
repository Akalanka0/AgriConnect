import seedAdmin from './adminSeeder.js';
import seedFarmers from './farmerSeeder.js';
import seedTesterFarmer from './testerFarmerSeeder.js';
import seedDemoIds from './demoIdsSeeder.js';
import seedDemoAccounts from './demoAccountsSeeder.js';
import seedMockData from './mockDataSeeder.js';
import sequelize from '../config/db.js';

const resetAndSeed = async () => {
    try {
        console.log('🗑️  Cleaning up database...');
        
        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // force: true drops all tables and recreates them
        await sequelize.sync({ force: true });
        
        // Enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('✅ Database cleaned and synchronized');

        console.log('🌱 Starting seeders...');
        await seedAdmin();
        await seedFarmers();
        await seedTesterFarmer();
        await seedDemoIds();
        await seedDemoAccounts();
        await seedMockData();

        console.log('🎉 Database reset and seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetAndSeed();
