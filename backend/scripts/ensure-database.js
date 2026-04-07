/* Ensures the target MySQL database exists using env in ../.env */
import path from 'path';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config({ path: path.join(process.cwd(), '.env') });

(async () => {
  const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_PORT = '3306',
    DB_NAME = 'agriconnect'
  } = process.env;

  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: Number(DB_PORT)
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database \"${DB_NAME}\" ensured`);
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to ensure database:', e.message);
    process.exit(1);
  }
})();

