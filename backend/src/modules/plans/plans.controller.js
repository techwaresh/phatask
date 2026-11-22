// src/modules/plans/plans.controller.js
import { PlansService } from './plans.service.js';

export class PlansController {
  static async list(req, res, next) {
    try {
      const { type, status, page, limit } = req.query;
      const result = await PlansService.listPlans(req.user, {
        type,
        status,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const plan = await PlansService.getPlanById(req.params.id, req.user);
      res.json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const plan = await PlansService.createPlan(req.user, req.body);
      res.status(201).json({
        success: true,
        data: plan,
        message: 'تم إنشاء الخطة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const plan = await PlansService.updatePlan(req.params.id, req.user, req.body);
      res.json({
        success: true,
        data: plan,
        message: 'تم تحديث الخطة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req, res, next) {
    try {
      const plan = await PlansService.submitPlan(req.params.id, req.user);
      res.json({
        success: true,
        data: plan,
        message: 'تم إرسال الخطة للمراجعة والاعتماد بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async approvalAction(req, res, next) {
    try {
      const { action, notes } = req.body;
      const plan = await PlansService.handleApprovalAction(req.params.id, req.user, {
        action,
        notes,
      });
      const actionText =
        action === 'approve' ? 'اعتماد' : action === 'reject' ? 'رفض' : 'طلب تعديل';
      res.json({
        success: true,
        data: plan,
        message: `تم ${actionText} الخطة بنجاح`,
      });
    } catch (error) {
      next(error);
    }
  }
}
