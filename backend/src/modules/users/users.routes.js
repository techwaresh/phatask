// src/modules/users/users.routes.js
import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', UsersController.list);
router.get('/me', (req, res) => res.json({ success: true, data: req.user }));
router.put('/me/profile', UsersController.updateProfile);
router.get('/:id', UsersController.getById);
router.put('/:id', requireRole('executive_director'), UsersController.update);

export default router;
