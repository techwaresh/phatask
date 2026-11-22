// database/knexfile.js
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

/** @type {import('knex').Knex.Config} */
const knexConfig = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'bwms',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4',
      timezone: '+00:00',
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js',
    },
    seeds: {
      directory: './seeds',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: 'utf8mb4',
      timezone: '+00:00',
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'js',
    },
    seeds: {
      directory: './seeds',
    },
  },
};

export default knexConfig;
