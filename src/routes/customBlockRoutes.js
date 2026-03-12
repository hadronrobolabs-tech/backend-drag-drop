import { Router } from 'express';
import * as customBlockController from '../controllers/customBlockController.js';

const router = Router();
router.get('/', customBlockController.list);
router.get('/:id', customBlockController.getById);
router.post('/', customBlockController.create);
router.put('/:id', customBlockController.update);
router.delete('/:id', customBlockController.remove);

export default router;
