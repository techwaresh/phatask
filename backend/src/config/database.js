// src/config/database.js
import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const knexConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'bwms',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+00:00',
    dateStrings: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      conn.query("SET time_zone = '+00:00';", (err) => done(err, conn));
    },
  },
  migrations: {
    directory: resolve(__dirname, '../../database/migrations'),
    tableName: 'knex_migrations',
    extension: 'js',
  },
  seeds: {
    directory: resolve(__dirname, '../../database/seeds'),
  },
};

const db = knex(knexConfig);

// اختبار الاتصال
db.raw('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  });

export default db;
