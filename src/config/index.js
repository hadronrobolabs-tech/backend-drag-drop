/**
 * App config. Single place for env and paths (Single Responsibility).
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3000,
  arduinoCliPath: process.env.ARDUINO_CLI_PATH || 'arduino-cli',
  arduinoHome: process.env.ARDUINO_HOME || path.join(os.homedir(), 'Arduino'),
};

// Optional: if a local bin exists next to backend-api (e.g. backend-api/bin/arduino-cli), use it
const localBin = path.resolve(__dirname, '..', '..', 'bin');
if (fs.existsSync(path.join(localBin, 'arduino-cli'))) {
  config.arduinoCliPath = path.join(localBin, 'arduino-cli');
}

export default config;
