// src/modules/users/users.service.js
import db from '../../config/database.js';

export class UsersService {
  /**
   * جلب قائمة المستخدمين
   */
  static async listUsers({ departmentId, role, isActive, search }) {
    let query = db('users as u')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .whereNull('u.deleted_at')
      .select(
        'u.id',
        'u.name',
        'u.email',
        'u.department_id',
        'u.is_active',
        'u.avatar_url',
        'u.last_login_at',
        'u.created_at',
        'd.name as department_name',
        'd.slug as department_slug'
      );

    if (departmentId) {
      query = query.where('u.department_id', departmentId);
    }
    if (typeof isActive === 'boolean') {
      query = query.where('u.is_active', isActive ? 1 : 0);
    }
    if (search) {
      query = query.where((b) => {
        b.where('u.name', 'like', `%${search}%`).orWhere('u.email', 'like', `%${search}%`);
      });
    }

    const users = await query.orderBy('u.id', 'asc');

    // إرفاق الأدوار لكل مستخدم
    const userIds = users.map((u) => u.id);
    const userRoles = await db('user_roles as ur')
      .join('roles as r', 'ur.role_id', 'r.id')
      .whereIn('ur.user_id', userIds)
      .select('ur.user_id', 'r.name as role_name', 'r.display_name');

    const roleMap = {};
    for (const ur of userRoles) {
      if (!roleMap[ur.user_id]) roleMap[ur.user_id] = [];
      roleMap[ur.user_id].push({ name: ur.role_name, displayName: ur.display_name });
    }

    return users.map((u) => ({
      ...u,
      roles: roleMap[u.id] || [],
    }));
  }

  /**
   * جلب مستخدم محدد
   */
  static async getUserById(id) {
    const user = await db('users as u')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .where('u.id', id)
      .whereNull('u.deleted_at')
      .select(
        'u.id',
        'u.name',
        'u.email',
        'u.department_id',
        'u.is_active',
        'u.avatar_url',
        'u.last_login_at',
        'u.created_at',
        'd.name as department_name'
      )
      .first();

    if (!user) {
      const error = new Error('المستخدم غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const roles = await db('user_roles as ur')
      .join('roles as r', 'ur.role_id', 'r.id')
      .where('ur.user_id', user.id)
      .select('r.name', 'r.display_name');

    user.roles = roles;
    return user;
  }

  /**
   * تعديل بيانات المستخدم (المدير التنفيذي)
   */
  static async updateUser(id, { name, department_id, is_active, role_name }) {
    const user = await db('users').where({ id }).first();
    if (!user) {
      const error = new Error('المستخدم غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const updateData = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (department_id !== undefined) updateData.department_id = department_id;
    if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

    await db('users').where({ id }).update(updateData);

    if (role_name) {
      const role = await db('roles').where({ name: role_name }).first();
      if (role) {
        await db('user_roles').where({ user_id: id }).delete();
        await db('user_roles').insert({ user_id: id, role_id: role.id });
      }
    }

    return this.getUserById(id);
  }

  /**
   * تحديث الملف الشخصي للمستخدم الحالي
   */
  static async updateProfile(userId, { name, avatar_url }) {
    const updateData = { updated_at: new Date() };
    if (name) updateData.name = name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    await db('users').where({ id: userId }).update(updateData);
    return this.getUserById(userId);
  }
}
