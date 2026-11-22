// src/modules/files/files.service.js
import db from '../../config/database.js';
import { uploadToCloud, getSignedUrl } from '../../config/cloudinary.js';

export class FilesService {
  /**
   * رفع ملف والتحقق من النوع والحد الأقصى للحجم (10MB)
   */
  static async uploadFile(user, file, entityType = 'general', entityId = null) {
    if (!file) {
      const error = new Error('لم يتم تحديد أي ملف للرفع');
      error.statusCode = 400;
      throw error;
    }

    // التحقق من الحجم (الحد الأقصى 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const error = new Error('حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت)');
      error.statusCode = 400;
      throw error;
    }

    // الأنواع المسموح بها: صور، PDF، Word، Excel
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error('نوع الملف غير مدعوم. المسموح: صور، PDF، DOCX، XLSX');
      error.statusCode = 400;
      throw error;
    }

    let publicUrl = null;
    let storageKey = `file_${Date.now()}_${file.originalname}`;
    let storageProvider = 'local_fallback';

    // محاولة الرفع إلى Cloudinary إذا كانت بياناته مهيأة
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const result = await uploadToCloud(file.buffer, {
          folder: entityType,
          resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
        });
        publicUrl = result.secure_url;
        storageKey = result.public_id;
        storageProvider = 'cloudinary';
      } catch (err) {
        console.warn('Cloudinary upload fallback:', err.message);
      }
    }

    const [fileId] = await db('files').insert({
      uploaded_by: user.id,
      original_name: file.originalname,
      storage_key: storageKey,
      storage_provider: storageProvider,
      mime_type: file.mimetype,
      file_size: file.size,
      public_url: publicUrl,
      created_at: new Date(),
    });

    // ربط المرفق بالكيان المناسب إذا تم تحديده
    if (entityType === 'task' && entityId) {
      await db('task_attachments').insert({
        task_id: entityId,
        file_id: fileId,
        created_at: new Date(),
      });
    } else if (entityType === 'report' && entityId) {
      await db('report_attachments').insert({
        report_id: entityId,
        file_id: fileId,
        created_at: new Date(),
      });
    }

    return db('files').where({ id: fileId }).first();
  }
}
