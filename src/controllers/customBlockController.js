/**
 * Custom block controller: list, create, get, update, delete. Delegates to customBlockService.
 */
import * as customBlockService from '../services/customBlockService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const blocks = await customBlockService.listCustomBlocks();
  res.json({ success: true, data: blocks });
});

export const getById = asyncHandler(async (req, res) => {
  const block = await customBlockService.getCustomBlockById(req.params.id);
  if (!block) {
    return res.status(404).json({ success: false, error: { message: 'Custom block not found' } });
  }
  res.json({ success: true, data: block });
});

export const create = asyncHandler(async (req, res) => {
  const block = await customBlockService.createCustomBlock(req.body);
  res.status(201).json({ success: true, data: block });
});

export const update = asyncHandler(async (req, res) => {
  const block = await customBlockService.updateCustomBlock(req.params.id, req.body);
  if (!block) {
    return res.status(404).json({ success: false, error: { message: 'Custom block not found' } });
  }
  res.json({ success: true, data: block });
});

export const remove = asyncHandler(async (req, res) => {
  const deleted = await customBlockService.deleteCustomBlock(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: { message: 'Custom block not found' } });
  }
  res.json({ success: true, data: null });
});
