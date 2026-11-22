// src/modules/admin/admin.controller.js
import { AdminService } from './admin.service.js';

export class AdminController {
  static async getActivityLogs(req, res, next) {
    try {
      const { userId, entityType, action, page, limit } = req.query;
      const result = await AdminService.getActivityLogs({
        userId: userId ? Number(userId) : undefined,
        entityType,
        action,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 30,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemSettings(req, res, next) {
    try {
      const settings = await AdminService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSystemSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const updated = await AdminService.updateSystemSetting(key, value);
      res.json({
        success: true,
        data: updated,
        message: 'تم تحديث الإعداد بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }
}
