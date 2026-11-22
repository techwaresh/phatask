// src/modules/auth/auth.controller.js
import { AuthService } from './auth.service.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(email, password, ip, userAgent);
      res.json({
        success: true,
        data: result,
        message: 'تم تسجيل الدخول بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      res.json({
        success: true,
        data: result,
        message: 'تم تجديد الجلسة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // JWT عديم الحالة (stateless) - العميل يتخلص من التوكن
      // ويمكن مستقبلاً إضافة Blacklist في Redis/DB إذا لزم الأمر
      res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
