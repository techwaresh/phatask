// src/modules/tasks/tasks.controller.js
import { TasksService } from './tasks.service.js';
import { TasksExcelService } from './tasks-excel.service.js';

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

  static async downloadTemplate(req, res, next) {
    try {
      const workbook = await TasksExcelService.generateTemplateWorkbook();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="tasks_import_template.xlsx"'
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  static async importTasks(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'يرجى إرفاق ملف إكسل بصيغة .xlsx للاستيراد',
          },
        });
      }

      const result = await TasksExcelService.importTasksFromExcel(req.user, req.file.buffer);
      res.status(201).json({
        success: true,
        data: result,
        message: `تم استيراد ${result.importedCount} مهمة بنجاح${result.failedCount > 0 ? `، وتعذر استيراد ${result.failedCount} صف` : ''}`,
      });
    } catch (error) {
      next(error);
    }
  }
}
