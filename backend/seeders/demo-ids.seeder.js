import GeneratedId from '../models/GeneratedId.js';
import { fileURLToPath } from 'url';

// Pre-populate the two demo codes in generated_ids so the registration
// flow can find and claim them. demo-accounts.seeder.js will mark them 'used'.
const seedDemoIds = async () => {
    try {
        const ids = [
            { code: 'FARM-2026-0001', type: 'farmer',     year: 2026 },
            { code: 'INST-2026-0001', type: 'instructor', year: 2026 },
        ];

        for (const entry of ids) {
            const [, created] = await GeneratedId.findOrCreate({
                where:    { code: entry.code },
                defaults: { ...entry, status: 'active' }
            });
            console.log(
                created
                    ? `🌱 Seeded ID: ${entry.code}`
                    : `👍 ID already exists: ${entry.code}`
            );
        }
    } catch (error) {
        console.error('❌ Error seeding demo IDs:', error);
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedDemoIds().then(() => process.exit(0));
}

export default seedDemoIds;
