/**
 * Firmware assembly: code generation + header. Depends on codeGenerator (Dependency Inversion).
 */
import { xmlToArduino } from './codeGenerator.js';
import * as customBlockService from '../customBlockService.js';

export async function generateCode(blockXml) {
  const customBlocks = await customBlockService.listCustomBlocks();
  return xmlToArduino(blockXml, customBlocks);
}

export async function assembleFirmware(blockXml, kitId) {
  const customBlocks = await customBlockService.listCustomBlocks();
  const code = xmlToArduino(blockXml, customBlocks);
  const header = `/*
 * Deltabotix - ${new Date().toISOString()}
 * Kit: ${kitId}
 */

`;
  return header + code;
}
