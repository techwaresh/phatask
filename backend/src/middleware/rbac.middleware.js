// src/middleware/rbac.middleware.js

/**
 * التحقق من أن المستخدم يمتلك دوراً أو أكثر من الأدوار المحددة
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مسجل دخول' },
      });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ليس لديك الصلاحية الكافية للقيام بهذا الإجراء',
        },
      });
    }
    next();
  };
}

/**
 * التحقق من أن المستخدم يمتلك صلاحية محددة
 */
export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مسجل دخول' },
      });
    }

    // المدير التنفيذي يمتلك كل الصلاحيات
    if (req.user.isExecutive || req.user.permissions.includes(permissionName)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_PERMISSION',
        message: `يتطلب هذا الإجراء صلاحية: ${permissionName}`,
      },
    });
  };
}

/**
 * التحقق من حدود الوصول المؤسسي (Department / Own boundary)
 * - المدير التنفيذي: يرى كل شيء
 * - مدير القسم: يرى قسمه
 * - الموظف: يرى ما يخصه فقط
 */
export function enforceDepartmentBoundary(entityDeptField = 'department_id', entityUserField = 'user_id') {
  return (req, res, next) => {
    // يمرر المعايير إلى handler التالي كـ query filter helper
    if (req.user.isExecutive) {
      req.scopeFilter = {}; // يرى كل شيء
    } else if (req.user.isDepartmentManager) {
      req.scopeFilter = { [entityDeptField]: req.user.department_id };
    } else {
      req.scopeFilter = { [entityUserField]: req.user.id };
    }
    next();
  };
}
