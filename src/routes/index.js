import { Router } from 'express';
import firmwareRoutes from './firmwareRoutes.js';
import kitRoutes from './kitRoutes.js';
import projectRoutes from './projectRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import customBlockRoutes from './customBlockRoutes.js';

const API_PREFIX = '/api/v1';
const router = Router();

router.use(API_PREFIX + '/firmware', firmwareRoutes);
router.use(API_PREFIX + '/kits', kitRoutes);
router.use(API_PREFIX + '/projects', projectRoutes);
router.use(API_PREFIX + '/upload', uploadRoutes);
router.use(API_PREFIX + '/custom-blocks', customBlockRoutes);

export default router;
