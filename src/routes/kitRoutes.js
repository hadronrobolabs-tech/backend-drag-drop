import { Router } from 'express';
import * as kitController from '../controllers/kitController.js';

const router = Router();
router.get('/', kitController.getAll);
router.get('/:id', kitController.getById);
export default router;
