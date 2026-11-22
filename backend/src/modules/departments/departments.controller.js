// src/modules/departments/departments.controller.js
import { DepartmentsService } from './departments.service.js';

export class DepartmentsController {
  static async list(req, res, next) {
    try {
      const departments = await DepartmentsService.listDepartments();
      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const department = await DepartmentsService.getDepartmentById(req.params.id);
      res.json({ success: true, data: department });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const department = await DepartmentsService.updateDepartment(req.params.id, req.body);
      res.json({ success: true, data: department, message: 'تم تحديث بيانات القسم بنجاح' });
    } catch (error) {
      next(error);
    }
  }

  static async setManager(req, res, next) {
    try {
      const { managerId } = req.body;
      const department = await DepartmentsService.setDepartmentManager(req.params.id, managerId);
      res.json({ success: true, data: department, message: 'تم تعيين مدير القسم بنجاح' });
    } catch (error) {
      next(error);
    }
  }
}
