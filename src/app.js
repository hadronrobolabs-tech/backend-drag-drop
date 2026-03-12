/**
 * Express app: CORS, JSON, routes. No listen (server.js listens).
 */
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(routes);

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Deltabotix API', port: process.env.PORT || 3000 });
});

export default app;
