/**
 * Deltabotix Backend API — entry point.
 * Run on the PC where Arduino is connected. Serves API + compile/upload.
 */
import './loadEnv.js';
import app from './src/app.js';
import config from './src/config/index.js';
import { initDb } from './db/index.js';

const PORT = config.port;

initDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log('Deltabotix API listening on http://localhost:' + PORT);
      console.log('Run this on the PC where Arduino is connected. Then use Upload in the browser.');
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or run: npm run kill-port`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err.message);
    if (err.message && err.message.includes('Access denied')) {
      console.error('Tip: Create a .env file with MYSQL_USER and MYSQL_PASSWORD (see .env.example).');
    }
    process.exit(1);
  });
