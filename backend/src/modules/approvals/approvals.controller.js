// src/modules/approvals/approvals.controller.js
import { ApprovalsService } from './approvals.service.js';

export class ApprovalsController {
  static async getPending(req, res, next) {
    try {
      const items = await ApprovalsService.getPendingApprovals(req.user);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await ApprovalsService.getApprovalHistory(req.user, { page, limit });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
