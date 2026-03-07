import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run all SQL migration files in order
 */
async function runMigrations() {
    const t = await sequelize.transaction();
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, { transaction: t });

        const [runMigrations] = await sequelize.query('SELECT name FROM migrations', { transaction: t });
        const runMigrationNames = runMigrations.map(m => m.name);

        const migrationsDir = path.join(__dirname);
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`\n📦 Found ${files.length} migration file(s)\n`);

        for (const file of files) {
            if (runMigrationNames.includes(file)) {
                console.log(`⏭️  Skipping: ${file} (already run)`);
                continue;
            }

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            console.log(`🔄 Running: ${file}`);
            
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await sequelize.query(statement.trim(), { transaction: t });
                }
            }

            await sequelize.query('INSERT INTO migrations (name) VALUES (?)', {
                replacements: [file],
                transaction: t
            });
            
            console.log(`✅ Completed: ${file}\n`);
        }

        await t.commit();
        console.log('🎉 All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migrations
runMigrations();
