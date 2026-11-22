// src/modules/files/files.controller.js
import multer from 'multer';
import { FilesService } from './files.service.js';

// استخدام MemoryStorage لتجنب حفظ الملفات محلياً على السيرفر
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const multerUpload = upload.single('file');

export class FilesController {
  static async upload(req, res, next) {
    try {
      const { entityType, entityId } = req.body;
      const fileRecord = await FilesService.uploadFile(
        req.user,
        req.file,
        entityType,
        entityId ? Number(entityId) : null
      );
      res.status(201).json({
        success: true,
        data: fileRecord,
        message: 'تم رفع الملف بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }
}
