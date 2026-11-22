// src/modules/dashboard/dashboard.routes.js
import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/executive', requireRole('executive_director'), DashboardController.getExecutive);
router.get('/employee', DashboardController.getEmployee);

export default router;
