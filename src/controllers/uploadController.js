/**
 * Upload controller: list ports, compile+upload. Delegates to UploadService.
 */
import * as uploadService from '../services/uploadService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getPorts = asyncHandler(async (req, res) => {
  const ports = await uploadService.listPorts();
  res.json({ success: true, data: { ports } });
});

export const compile = asyncHandler(async (req, res) => {
  const { code, board: boardFqbn } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid "code" in body' });
  }
  const result = await uploadService.compileOnly({ code, boardFqbn });
  if (result.success) {
    return res.json({
      success: true,
      message: result.message,
      log: result.log,
      hexBase64: result.hexBase64,
    });
  }
  return res.json({
    success: false,
    message: result.message,
    log: result.log,
    hexBase64: null,
  });
});

export const upload = asyncHandler(async (req, res) => {
  const { code, board: boardFqbn, port } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid "code" in body' });
  }
  const result = await uploadService.compileAndUpload({
    code,
    boardFqbn,
    port,
  });
  if (result.success) {
    return res.json({ success: true, message: result.message, log: result.log });
  }
  return res.json({
    success: false,
    message: result.message,
    log: result.log,
    fix: result.fix ?? undefined,
  });
});
