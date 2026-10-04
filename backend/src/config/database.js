import pg from 'pg';
import config from './index.js';

const { Pool } = pg;

const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeout,
  connectionTimeoutMillis: config.db.connectionTimeout,
  query_timeout: config.db.queryTimeout,
};

if (config.db.ssl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  // console.log('New client connected to db');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // can log query time here
    return res;
  } catch (error) {
    throw error;
  }
};
