// src/middleware/auth.middleware.js
import { verifyAccessToken } from '../config/jwt.js';
import db from '../config/database.js';

/**
 * Middleware للتحقق من هوية المستخدم بواسطة JWT Access Token
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول للوصول إلى هذا المسار',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED_OR_INVALID',
          message: 'انتهت صلاحية جلسة تسجيل الدخول أو الرمز غير صالح',
        },
      });
    }

    // جلب المستخدم والتأكد من أنه نشط
    const user = await db('users')
      .where({ id: decoded.id, is_active: 1 })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'المستخدم غير موجود أو تم تعطيل حسابه',
        },
      });
    }

    // جلب أدوار المستخدم وصلاحياته
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.id', 'roles.name', 'roles.display_name');

    const roleIds = userRoles.map((r) => r.id);
    const roleNames = userRoles.map((r) => r.name);

    let permissions = [];
    if (roleIds.length > 0) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .whereIn('role_permissions.role_id', roleIds)
        .select('permissions.name');
      permissions = [...new Set(perms.map((p) => p.name))];
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      department_id: user.department_id,
      roles: roleNames,
      permissions,
      isExecutive: roleNames.includes('executive_director'),
      isDepartmentManager: roleNames.includes('department_manager'),
      isEmployee: roleNames.includes('employee'),
    };

    next();
  } catch (error) {
    next(error);
  }
}
