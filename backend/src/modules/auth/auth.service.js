// src/modules/auth/auth.service.js
import argon2 from 'argon2';
import crypto from 'crypto';
import db from '../../config/database.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt.js';
import { sendEmail } from '../../config/mailer.js';
import { logger } from '../../utils/logger.js';

export class AuthService {
  /**
   * تسجيل الدخول
   */
  static async login(email, password, ipAddress = null, userAgent = null) {
    const user = await db('users')
      .where({ email: email.toLowerCase().trim() })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      const error = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    const isMatch = await argon2.verify(user.password_hash, password);
    if (!isMatch) {
      const error = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // جلب الأدوار
    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.id', 'roles.name', 'roles.display_name');

    const roleNames = roles.map((r) => r.name);
    const roleIds = roles.map((r) => r.id);

    // جلب الصلاحيات
    let permissions = [];
    if (roleIds.length > 0) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .whereIn('role_permissions.role_id', roleIds)
        .select('permissions.name');
      permissions = [...new Set(perms.map((p) => p.name))];
    }

    // جلب القسم
    let department = null;
    if (user.department_id) {
      department = await db('departments').where({ id: user.department_id }).first();
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      department_id: user.department_id,
      roles: roleNames,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });

    // تحديث تاريخ آخر تسجيل دخول
    await db('users').where({ id: user.id }).update({ last_login_at: new Date() });

    // تسجيل في سجل النشاطات
    try {
      await db('activity_logs').insert({
        user_id: user.id,
        action: 'login',
        entity_type: 'auth',
        entity_id: user.id,
        description: 'تسجيل دخول ناجح',
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (e) {
      logger.warn(`Failed to log activity: ${e.message}`);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department_id: user.department_id,
        department: department ? { id: department.id, name: department.name, slug: department.slug } : null,
        roles: roleNames,
        permissions,
        avatar_url: user.avatar_url,
      },
    };
  }

  /**
   * تجديد التوكن
   */
  static async refresh(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      const error = new Error('رمز التجديد غير صالح أو منتهي الصلاحية');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const user = await db('users')
      .where({ id: decoded.id, is_active: 1 })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      const error = new Error('المستخدم غير موجود أو تم إيقاف حسابه');
      error.statusCode = 401;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .pluck('roles.name');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      department_id: user.department_id,
      roles,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken({ id: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * تغيير كلمة المرور
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      const error = new Error('المستخدم غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await argon2.verify(user.password_hash, currentPassword);
    if (!isMatch) {
      const error = new Error('كلمة المرور الحالية غير صحيحة');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    const newHash = await argon2.hash(newPassword);
    await db('users').where({ id: userId }).update({
      password_hash: newHash,
      updated_at: new Date(),
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * طلب استعادة كلمة المرور
   */
  static async forgotPassword(email) {
    const user = await db('users')
      .where({ email: email.toLowerCase().trim() })
      .whereNull('deleted_at')
      .first();

    // لأسباب أمنية، نرجع نفس الرد حتى لو لم يكن المستخدم موجوداً
    if (!user) {
      return { message: 'إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة التعيين إليه' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ساعة

    await db('password_resets').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - نظام إدارة العمل بصمة (BWMS)',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>مرحباً ${user.name}</h2>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة BWMS.</p>
          <p>اضغط على الزر التالي لإعادة تعيينها (الرابط صالح لمدة ساعة واحدة):</p>
          <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background:#258579; color:#fff; text-decoration:none; border-radius:5px; margin: 15px 0;">إعادة تعيين كلمة المرور</a>
          <p>إذا لم تكن قد طلبت ذلك، يمكنك تجاهل هذه الرسالة بأمان.</p>
        </div>
      `,
    });

    return { message: 'إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة التعيين إليه' };
  }

  /**
   * إعادة تعيين كلمة المرور بالرمز
   */
  static async resetPassword(token, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await db('password_resets')
      .where({ token_hash: tokenHash })
      .whereNull('used_at')
      .where('expires_at', '>', new Date())
      .first();

    if (!resetRecord) {
      const error = new Error('رمز إعادة التعيين غير صالح أو منتهي الصلاحية');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const newHash = await argon2.hash(newPassword);

    await db.transaction(async (trx) => {
      await trx('users').where({ id: resetRecord.user_id }).update({
        password_hash: newHash,
        updated_at: new Date(),
      });

      await trx('password_resets').where({ id: resetRecord.id }).update({
        used_at: new Date(),
      });
    });

    return { message: 'تم تعيين كلمة المرور الجديدة بنجاح' };
  }
}
