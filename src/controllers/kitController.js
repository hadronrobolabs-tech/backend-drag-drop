/**
 * Kit controller: list kits, get by id. Delegates to KitService.
 */
import * as kitService from '../services/kitService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getAll = asyncHandler(async (req, res) => {
  const kits = kitService.getAllKits();
  res.json({ success: true, data: kits });
});

export const getById = asyncHandler(async (req, res) => {
  const kit = kitService.getKitById(req.params.id);
  if (!kit) {
    return res.status(404).json({ success: false, error: { message: 'Kit not found' } });
  }
  res.json({ success: true, data: kit });
});
