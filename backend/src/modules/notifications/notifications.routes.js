// src/modules/notifications/notifications.routes.js
import { Router } from 'express';
import { NotificationController } from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);

export default router;
