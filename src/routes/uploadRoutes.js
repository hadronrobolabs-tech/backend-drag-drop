import { Router } from 'express';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();
router.get('/ports', uploadController.getPorts);
router.post('/compile', uploadController.compile);
router.post('/', uploadController.upload);
export default router;
