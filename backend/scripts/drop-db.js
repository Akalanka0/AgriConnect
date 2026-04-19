import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dropDatabase = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        const dbName = process.env.DB_NAME || 'agriconnect';

        console.log(`🗑️ Dropping database "${dbName}" if it exists...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        console.log(`✅ Database "${dbName}" dropped successfully.`);
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error dropping database:', error);
        process.exit(1);
    }
};

dropDatabase();