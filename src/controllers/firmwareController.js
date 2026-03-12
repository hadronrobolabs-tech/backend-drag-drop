/**
 * Firmware controller: generate code, assemble firmware. Delegates to FirmwareService.
 */
import * as firmwareService from '../services/firmware/firmwareService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const generateCode = asyncHandler(async (req, res) => {
  const { blockXml, kitId } = req.body || {};
  if (!blockXml || !kitId) {
    return res.status(400).json({ success: false, error: { message: 'blockXml and kitId required' } });
  }
  const code = await firmwareService.generateCode(blockXml);
  res.json({ success: true, data: { code, language: 'arduino' } });
});

export const assemble = asyncHandler(async (req, res) => {
  const { blockXml, kitId } = req.body || {};
  if (!blockXml || !kitId) {
    return res.status(400).json({ success: false, error: { message: 'blockXml and kitId required' } });
  }
  const firmware = await firmwareService.assembleFirmware(blockXml, kitId);
  res.json({ success: true, data: { firmware, kitId } });
});
