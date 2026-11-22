// src/modules/admin/admin.routes.js
import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('executive_director'));

router.get('/activity-logs', AdminController.getActivityLogs);
router.get('/system-settings', AdminController.getSystemSettings);
router.put('/system-settings/:key', AdminController.updateSystemSetting);

export default router;
