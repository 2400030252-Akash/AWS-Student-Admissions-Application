import { Router } from 'express';
import * as controller from '../controllers/applicationController.js';
import { validateApplication } from '../middleware/validator.js';

const router = Router();
router.get('/stats', controller.getApplicationStats);
router.get('/', controller.getApplications);
router.get('/:id', controller.getApplication);
router.post('/', validateApplication, controller.createApplication);
router.put('/:id', controller.updateApplication);
router.delete('/:id', controller.deleteApplication);

export default router;
