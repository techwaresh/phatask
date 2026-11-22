// src/middleware/notFoundHandler.js
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `المسار المطلوب غير موجود: ${req.method} ${req.originalUrl}`,
    },
  });
}
