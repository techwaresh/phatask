// src/modules/dashboard/dashboard.controller.js
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getExecutive(req, res, next) {
    try {
      const stats = await DashboardService.getExecutiveStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployee(req, res, next) {
    try {
      const stats = await DashboardService.getEmployeeStats(req.user.id);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
