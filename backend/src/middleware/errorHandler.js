// src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);

  // Validation Error (Zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'بيانات الإدخال غير صالحة',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Custom Application Error
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
        details: err.details || null,
      },
    });
  }

  // Database Unique Constraint Error
  if (err.code === 'ER_DUP_ENTRY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'هذا السجل موجود مسبقاً في النظام',
      },
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'جلسة تسجيل الدخول منتهية أو غير صالحة',
      },
    });
  }

  // Generic 500
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً.',
      ...(isDev ? { debug: err.message, stack: err.stack } : {}),
    },
  });
}
