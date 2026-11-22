// src/modules/notifications/notifications.service.js
import db from '../../config/database.js';
import { sendEmail } from '../../config/mailer.js';
import { logger } from '../../utils/logger.js';

export class NotificationService {
  /**
   * إنشاء إشعار داخلي واختيارياً إرسال بريد إلكتروني
   */
  static async notify({
    userId,
    type,
    title,
    body,
    relatedEntityType = null,
    relatedEntityId = null,
    sendEmailNotification = true,
  }) {
    try {
      // 1. إنشاء الإشعار في قاعدة البيانات
      const [notificationId] = await db('notifications').insert({
        user_id: userId,
        type,
        title,
        body,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        is_read: 0,
        created_at: new Date(),
      });

      // 2. تسجيل قناة In-App
      await db('notification_logs').insert({
        notification_id: notificationId,
        channel: 'in_app',
        status: 'sent',
        sent_at: new Date(),
      });

      // 3. إرسال بريد إلكتروني إذا كان مطلوباً
      if (sendEmailNotification) {
        const user = await db('users').where({ id: userId }).select('email', 'name').first();
        if (user && user.email) {
          sendEmail({
            to: user.email,
            subject: `[نظام بصمة BWMS] ${title}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #333;">
                <h3 style="color: #173F45;">مرحباً ${user.name}</h3>
                <div style="background: #F4F6F7; padding: 15px; border-right: 4px solid #258579; border-radius: 4px; margin: 15px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #258579;">${title}</h4>
                  <p style="margin: 0;">${body || ''}</p>
                </div>
                <p style="font-size: 13px; color: #777;">تم إرسال هذا الإشعار تلقائياً من منصة BWMS - مؤسسة بصمة للأعمال الإنسانية.</p>
              </div>
            `,
          }).then(async (result) => {
            await db('notification_logs').insert({
              notification_id: notificationId,
              channel: 'email',
              status: result.success ? 'sent' : 'failed',
              sent_at: result.success ? new Date() : null,
              error_message: result.error || null,
            });
          }).catch((err) => {
            logger.warn(`Email notification background error: ${err.message}`);
          });
        }
      }

      return notificationId;
    } catch (error) {
      logger.error(`Notification creation error: ${error.message}`);
      return null;
    }
  }

  /**
   * جلب إشعارات المستخدم
   */
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const offset = (page - 1) * limit;

    let query = db('notifications').where({ user_id: userId });
    if (unreadOnly) {
      query = query.where({ is_read: 0 });
    }

    const [{ total }] = await query.clone().count('id as total');

    const items = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * جلب عدد الإشعارات غير المقروءة
   */
  static async getUnreadCount(userId) {
    const [{ count }] = await db('notifications')
      .where({ user_id: userId, is_read: 0 })
      .count('id as count');
    return Number(count);
  }

  /**
   * تعليم إشعار كمقروء
   */
  static async markAsRead(notificationId, userId) {
    await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .update({ is_read: 1, read_at: new Date() });
    return true;
  }

  /**
   * تعليم جميع إشعارات المستخدم كمقروءة
   */
  static async markAllAsRead(userId) {
    await db('notifications')
      .where({ user_id: userId, is_read: 0 })
      .update({ is_read: 1, read_at: new Date() });
    return true;
  }
}
