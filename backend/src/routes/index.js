import { Router } from 'express';
import healthRoutes from './health.js';
import studentRoutes from './students.js';
import applicationRoutes from './applications.js';
import courseRoutes from './courses.js';
import metricsRoutes from './metrics.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/students', studentRoutes);
router.use('/applications', applicationRoutes);
router.use('/courses', courseRoutes);
router.use('/metrics', metricsRoutes);

export default router;
