/**
 * Express app: CORS, JSON, routes. No listen (server.js listens).
 */
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { getDb } from '../db/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(routes);

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Deltabotix API', port: process.env.PORT || 3000 });
});

/** Health check: backend + DB connection. Ping /health to verify both are up. */
app.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  let db = 'unknown';
  try {
    const pool = getDb();
    await pool.query('SELECT 1');
    db = 'connected';
    res.status(200).json({ status: 'ok', service: 'backend-drag-drop', db, timestamp });
  } catch (err) {
    db = 'disconnected';
    res.status(503).json({
      status: 'error',
      service: 'backend-drag-drop',
      db,
      error: err instanceof Error ? err.message : String(err),
      timestamp,
    });
  }
});

export default app;
