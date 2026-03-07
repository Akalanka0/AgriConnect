import seedDemoIds from './demo-ids.seeder.js';
import seedDemoAccounts from './demo-accounts.seeder.js';
import sequelize from '../../config/db.js';

// ─── Demo seeder runner ───────────────────────────────────────────────────────
// Populates demo instructor + farmer accounts for development / client demos.
// Run AFTER the production seeders (npm run seed).
//
// TO REMOVE FOR CLIENT DELIVERY: delete the entire seeders/demo/ folder and
// remove the "seed:demo" script from package.json.
// ─────────────────────────────────────────────────────────────────────────────

const runDemoSeeders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        await seedDemoIds();      // 1. pre-populate generated_ids codes
        await seedDemoAccounts(); // 2. demo instructor + demo farmer accounts

        console.log('🎉 Demo seeders completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running demo seeders:', error);
        process.exit(1);
    }
};

runDemoSeeders();
