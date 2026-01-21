import seedAdmin from './adminSeeder.js';
import seedFarmers from './farmerSeeder.js';
import sequelize from '../config/db.js';

const runSeeders = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('✅ Database synchronized');

        await seedAdmin();
        await seedFarmers();

        console.log('🎉 All seeders ran successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();
