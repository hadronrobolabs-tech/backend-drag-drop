/**
 * Upload service: Arduino CLI (ports, compile, upload). Single responsibility.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';

const KIT_TO_FQBN = {
  'arduino-uno': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano',
};

function runCommand(cmd, args, cwd) {
  const executable = cmd === 'arduino-cli' ? config.arduinoCliPath : cmd;
  return new Promise((resolve) => {
    const proc = spawn(executable, args, {
      cwd: cwd || undefined,
      shell: false,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr?.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('close', (code) => resolve({ stdout, stderr, code }));
  });
}

export async function listPorts() {
  const result = await runCommand('arduino-cli', ['board', 'list', '--format', 'json'], process.cwd());
  let ports = [];
  try {
    const out = (result.stdout || '').trim();
    if (out) {
      const data = JSON.parse(out);
      const raw = data.detected_ports || [];
      for (const p of raw) {
        // New arduino-cli format: port.address; old format: p.address
        const address = (p.port && p.port.address) ? p.port.address : (p.address || '');
        const boards = p.boards || (p.port && p.port.boards) || [];
        if (address) {
          ports.push({ address, boards });
        }
      }
    }
  } catch (_) {}
  return ports;
}

/**
 * Compile only: write sketch, run arduino-cli compile --export-binaries, read .hex, return base64.
 * For Web Serial flow: backend compiles, browser flashes. No upload on server.
 */
export async function compileOnly({ code, boardFqbn }) {
  const board = boardFqbn || KIT_TO_FQBN['arduino-uno'] || 'arduino:avr:uno';
  const sketchName = 'Deltabotix_Blink';
  const arduinoHome = config.arduinoHome;
  const baseDir = path.join(arduinoHome, `deltabot_compile_${Date.now()}`);
  const sketchDir = path.join(baseDir, sketchName);
  const buildDir = path.join(baseDir, 'build');
  const inoPath = path.join(sketchDir, `${sketchName}.ino`);

  try {
    if (!fs.existsSync(arduinoHome)) {
      fs.mkdirSync(arduinoHome, { recursive: true, mode: 0o755 });
    }
    fs.mkdirSync(sketchDir, { recursive: true, mode: 0o755 });
    fs.writeFileSync(inoPath, code, 'utf8');
    fs.chmodSync(baseDir, 0o755);
    fs.chmodSync(sketchDir, 0o755);
    fs.chmodSync(inoPath, 0o644);
  } catch (err) {
    return {
      success: false,
      message: 'Failed to write sketch file',
      log: err.message,
      hexBase64: null,
    };
  }

  const sketchPath = path.resolve(sketchDir);
  const log = [];

  try {
    log.push('Compiling...');
    const compileResult = await runCommand(
      'arduino-cli',
      ['compile', '--fqbn', board, '--export-binaries', '--build-path', buildDir, sketchPath],
      undefined
    );
    log.push(compileResult.stdout || '');
    if (compileResult.stderr) log.push(compileResult.stderr);

    let hexBase64 = null;
    if (compileResult.code === 0) {
      function findHex(dir) {
        if (!fs.existsSync(dir)) return null;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isFile() && e.name.endsWith('.hex')) return full;
        }
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            const found = findHex(full);
            if (found) return found;
          }
        }
        return null;
      }
      const hexPath = findHex(buildDir) || path.join(buildDir, `${sketchName}.ino.hex`);
      if (fs.existsSync(hexPath)) {
        hexBase64 = fs.readFileSync(hexPath, { encoding: 'base64' });
      }
    }

    try {
      fs.rmSync(baseDir, { recursive: true });
    } catch (_) {}

    if (compileResult.code !== 0) {
      return { success: false, message: 'Compilation failed', log: log.join('\n'), hexBase64: null };
    }
    if (!hexBase64) {
      return { success: false, message: 'Compilation succeeded but no .hex file found', log: log.join('\n'), hexBase64: null };
    }
    return { success: true, message: 'Compiled successfully', log: log.join('\n'), hexBase64 };
  } catch (err) {
    try {
      fs.rmSync(baseDir, { recursive: true });
    } catch (_) {}
    return {
      success: false,
      message: err.message || 'Compile error',
      log: log.join('\n'),
      hexBase64: null,
    };
  }
}

export async function compileAndUpload({ code, boardFqbn, port }) {
  const board = boardFqbn || KIT_TO_FQBN['arduino-uno'] || 'arduino:avr:uno';
  const sketchName = 'Deltabotix_Blink';
  const arduinoHome = config.arduinoHome;
  const baseDir = path.join(arduinoHome, `deltabot_upload_${Date.now()}`);
  const sketchDir = path.join(baseDir, sketchName);
  const inoPath = path.join(sketchDir, `${sketchName}.ino`);

  try {
    if (!fs.existsSync(arduinoHome)) {
      fs.mkdirSync(arduinoHome, { recursive: true, mode: 0o755 });
    }
    fs.mkdirSync(sketchDir, { recursive: true, mode: 0o755 });
    fs.writeFileSync(inoPath, code, 'utf8');
    fs.chmodSync(baseDir, 0o755);
    fs.chmodSync(sketchDir, 0o755);
    fs.chmodSync(inoPath, 0o644);
  } catch (err) {
    return {
      success: false,
      message: 'Failed to write sketch file',
      log: err.message,
    };
  }

  const sketchPath = path.resolve(sketchDir);
  const log = [];

  try {
    log.push('Compiling...');
    const compileResult = await runCommand(
      'arduino-cli',
      ['compile', '--fqbn', board, sketchPath],
      undefined
    );
    log.push(compileResult.stdout || '');
    if (compileResult.stderr) log.push(compileResult.stderr);
    if (compileResult.code !== 0) {
      try {
        fs.rmSync(baseDir, { recursive: true });
      } catch (_) {}
      return { success: false, message: 'Compilation failed', log: log.join('\n') };
    }

    log.push('Uploading...');
    const uploadArgs = ['upload', '--fqbn', board, sketchPath];
    if (port) uploadArgs.splice(1, 0, '-p', port);
    else uploadArgs.splice(1, 0, '--discovery-timeout', '15s');
    const uploadResult = await runCommand('arduino-cli', uploadArgs, undefined);
    log.push(uploadResult.stdout || '');
    if (uploadResult.stderr) log.push(uploadResult.stderr);
    try {
      fs.rmSync(baseDir, { recursive: true });
    } catch (_) {}

    if (uploadResult.code !== 0) {
      const fullLog = log.join('\n');
      const isPermissionDenied = /Permission denied|cannot open port/i.test(fullLog);
      const fix = isPermissionDenied
        ? 'Linux: run "sudo usermod -aG dialout $USER" then log out and back in.'
        : null;
      return {
        success: false,
        message: 'Upload failed. Check board and port.',
        log: fullLog,
        fix,
      };
    }
    return { success: true, message: 'Upload complete!', log: log.join('\n') };
  } catch (err) {
    try {
      fs.rmSync(baseDir, { recursive: true });
    } catch (_) {}
    return {
      success: false,
      message: err.message || 'Upload error',
      log: log.join('\n'),
    };
  }
}
