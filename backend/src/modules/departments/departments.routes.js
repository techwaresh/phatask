// src/modules/departments/departments.routes.js
import { Router } from 'express';
import { DepartmentsController } from './departments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', DepartmentsController.list);
router.get('/:id', DepartmentsController.getById);
router.put('/:id', requireRole('executive_director'), DepartmentsController.update);
router.put('/:id/manager', requireRole('executive_director'), DepartmentsController.setManager);

export default router;
