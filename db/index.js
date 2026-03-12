/**
 * DB layer: MySQL (mysql2). Pool + single schema file.
 * All tables live in db/schema.sql — update that file when adding new tables/columns.
 */
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool = null;

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

function getConfig() {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'drag_and_drop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

async function runSchema(connection) {
  if (!fs.existsSync(SCHEMA_FILE)) return;
  let sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  sql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      await connection.query(stmt);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_INDEX') continue;
      throw err;
    }
  }
}

export async function initDb() {
  if (pool) return pool;
  const config = getConfig();
  const dbName = config.database;
  const { host, port, user, password, ...rest } = config;
  const baseConfig = { host, port, user, password, ...rest };
  const tempConn = await mysql.createConnection(baseConfig);
  await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await tempConn.end();
  pool = mysql.createPool(config);
  const conn = await pool.getConnection();
  try {
    await runSchema(conn);
  } finally {
    conn.release();
  }
  return pool;
}

export function getDb() {
  if (!pool) throw new Error('DB not initialized. Call initDb() at startup (e.g. in server.js).');
  return pool;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
