import { Router } from 'express';
import * as firmwareController from '../controllers/firmwareController.js';

const router = Router();
router.post('/generate', firmwareController.generateCode);
router.post('/assemble', firmwareController.assemble);
export default router;
