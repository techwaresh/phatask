// src/modules/approvals/approvals.routes.js
import { Router } from 'express';
import { ApprovalsController } from './approvals.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('executive_director', 'department_manager'));

router.get('/pending', ApprovalsController.getPending);
router.get('/history', ApprovalsController.getHistory);

export default router;
