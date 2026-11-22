// src/modules/admin/admin.service.js
import db from '../../config/database.js';

export class AdminService {
  /**
   * جلب سجل النشاطات مع التصفية
   */
  static async getActivityLogs({ userId, entityType, action, page = 1, limit = 30 }) {
    const offset = (page - 1) * limit;

    let query = db('activity_logs as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .select('a.*', 'u.name as user_name', 'u.email as user_email');

    if (userId) query = query.where('a.user_id', userId);
    if (entityType) query = query.where('a.entity_type', entityType);
    if (action) query = query.where('a.action', action);

    const [{ total }] = await query.clone().count('a.id as total');

    const logs = await query
      .orderBy('a.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      items: logs,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * جلب إعدادات النظام
   */
  static async getSystemSettings() {
    return db('system_settings').select('*');
  }

  /**
   * تحديث إعداد في النظام
   */
  static async updateSystemSetting(key, value) {
    await db('system_settings').where({ key }).update({
      value,
      updated_at: new Date(),
    });
    return db('system_settings').where({ key }).first();
  }
}
