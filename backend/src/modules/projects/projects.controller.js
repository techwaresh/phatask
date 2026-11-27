// src/modules/projects/projects.controller.js
import { ProjectsService } from './projects.service.js';

export class ProjectsController {
  static async list(req, res, next) {
    try {
      const result = await ProjectsService.listProjects(req.user, {
        search: req.query.search,
        status: req.query.status,
        stage: req.query.stage,
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
      const project = await ProjectsService.getProjectById(req.params.id, req.user);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const project = await ProjectsService.createProject(req.user, req.body);
      res.status(201).json({
        success: true,
        data: project,
        message: 'تم إنشاء المشروع بنجاح وإسناد أولى مهام الموازنة للمالية',
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveStageData(req, res, next) {
    try {
      const { stage, data } = req.body;
      const project = await ProjectsService.saveStageData(req.params.id, stage, data, req.user);
      res.json({
        success: true,
        data: project,
        message: 'تم حفظ بيانات المرحلة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async advanceStage(req, res, next) {
    try {
      const { nextStage } = req.body;
      const project = await ProjectsService.advanceStage(req.params.id, nextStage, req.user);
      res.json({
        success: true,
        data: project,
        message: 'تم الانتقال إلى المرحلة التالية بنجاح وتوليد المهام المقابلة',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req, res, next) {
    try {
      const taskId = await ProjectsService.createProjectTask(req.params.id, req.user, req.body);
      res.status(201).json({
        success: true,
        data: { id: taskId },
        message: 'تمت إضافة المهمة إلى المشروع بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFile(req, res, next) {
    try {
      const fileId = await ProjectsService.addProjectFile(req.params.id, req.user, req.body);
      res.status(201).json({
        success: true,
        data: { id: fileId },
        message: 'تم إرفاق المستند في المشروع بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }
}
