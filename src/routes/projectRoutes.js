import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';

const router = Router();
router.get('/', projectController.list);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);
export default router;
