import { Router } from 'express';
import * as controller from '../controllers/courseController.js';

const router = Router();
router.get('/', controller.getCourses);

export default router;
