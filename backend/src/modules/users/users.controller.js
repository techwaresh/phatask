// src/modules/users/users.controller.js
import { UsersService } from './users.service.js';

export class UsersController {
  static async list(req, res, next) {
    try {
      const { departmentId, role, isActive, search } = req.query;
      const users = await UsersService.listUsers({
        departmentId: departmentId ? Number(departmentId) : undefined,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search,
      });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const user = await UsersService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const user = await UsersService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user, message: 'تم تحديث بيانات المستخدم بنجاح' });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const user = await UsersService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: user, message: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
      next(error);
    }
  }
}
