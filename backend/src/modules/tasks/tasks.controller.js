// src/modules/tasks/tasks.controller.js
import { TasksService } from './tasks.service.js';

export class TasksController {
  static async list(req, res, next) {
    try {
      const result = await TasksService.listTasks(req.user, {
        status: req.query.status,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo ? Number(req.query.assignedTo) : undefined,
        createdBy: req.query.createdBy ? Number(req.query.createdBy) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
        planId: req.query.planId ? Number(req.query.planId) : undefined,
        dueBefore: req.query.dueBefore,
        search: req.query.search,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const task = await TasksService.getTaskById(req.params.id, req.user);
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const task = await TasksService.createTask(req.user, req.body);
      res.status(201).json({
        success: true,
        data: task,
        message: 'تم إنشاء المهمة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req, res, next) {
    try {
      const task = await TasksService.updateProgress(req.params.id, req.user, req.body);
      res.json({
        success: true,
        data: task,
        message: 'تم تحديث نسبة الإنجاز بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const task = await TasksService.approveTask(req.params.id, req.user, req.body);
      res.json({
        success: true,
        data: task,
        message: 'تمت معالجة قرار اعتماد المهمة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req, res, next) {
    try {
      const comment = await TasksService.addComment(req.params.id, req.user, req.body.content);
      res.status(201).json({
        success: true,
        data: comment,
        message: 'تمت إضافة التعليق بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }
}
