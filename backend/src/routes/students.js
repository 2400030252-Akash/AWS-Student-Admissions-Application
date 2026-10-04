import { Router } from 'express';
import * as controller from '../controllers/studentController.js';
import { validateStudent } from '../middleware/validator.js';

const router = Router();
router.get('/', controller.getStudents);
router.get('/:id', controller.getStudent);
router.post('/', validateStudent, controller.createStudent);
router.put('/:id', controller.updateStudent);
router.delete('/:id', controller.deleteStudent);

export default router;
