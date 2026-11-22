// src/modules/notifications/notifications.controller.js
import { NotificationService } from './notifications.service.js';

export class NotificationController {
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.getUserNotifications(req.user.id, {
        page,
        limit,
        unreadOnly,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user.id);
      res.json({ success: true, message: 'تم تعليم الإشعار كمقروء' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'تم تعليم جميع الإشعارات كمقروءة' });
    } catch (error) {
      next(error);
    }
  }
}
