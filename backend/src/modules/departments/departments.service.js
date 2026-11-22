// src/modules/departments/departments.service.js
import db from '../../config/database.js';

export class DepartmentsService {
  /**
   * جلب جميع الأقسام مع بيانات المدير وعدد الموظفين
   */
  static async listDepartments() {
    const departments = await db('departments as d')
      .leftJoin('users as u', 'd.manager_id', 'u.id')
      .select(
        'd.id',
        'd.name',
        'd.slug',
        'd.manager_id',
        'd.description',
        'd.is_active',
        'd.created_at',
        'u.name as manager_name',
        'u.email as manager_email'
      )
      .orderBy('d.id', 'asc');

    // إحصاء عدد الموظفين في كل قسم
    const counts = await db('users')
      .whereNull('deleted_at')
      .groupBy('department_id')
      .select('department_id')
      .count('id as member_count');

    const countMap = Object.fromEntries(counts.map((c) => [c.department_id, Number(c.member_count)]));

    return departments.map((d) => ({
      ...d,
      member_count: countMap[d.id] || 0,
    }));
  }

  /**
   * جلب تفاصيل قسم مع موظفيه
   */
  static async getDepartmentById(id) {
    const dept = await db('departments as d')
      .leftJoin('users as u', 'd.manager_id', 'u.id')
      .where('d.id', id)
      .select(
        'd.*',
        'u.name as manager_name',
        'u.email as manager_email'
      )
      .first();

    if (!dept) {
      const error = new Error('القسم غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const members = await db('users')
      .where({ department_id: id })
      .whereNull('deleted_at')
      .select('id', 'name', 'email', 'avatar_url', 'is_active');

    dept.members = members;
    return dept;
  }

  /**
   * تحديث بيانات قسم
   */
  static async updateDepartment(id, { name, description, is_active }) {
    await db('departments').where({ id }).update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active: is_active ? 1 : 0 }),
      updated_at: new Date(),
    });
    return this.getDepartmentById(id);
  }

  /**
   * تغيير مدير القسم وتحديث دوره
   */
  static async setDepartmentManager(deptId, newManagerId) {
    const dept = await db('departments').where({ id: deptId }).first();
    if (!dept) {
      const error = new Error('القسم غير موجود');
      error.statusCode = 404;
      throw error;
    }

    if (newManagerId) {
      const newManager = await db('users').where({ id: newManagerId }).first();
      if (!newManager) {
        const error = new Error('المستخدم المحدد كمدير غير موجود');
        error.statusCode = 404;
        throw error;
      }
    }

    await db.transaction(async (trx) => {
      const oldManagerId = dept.manager_id;

      // تحديث manager_id في جدول الأقسام
      await trx('departments').where({ id: deptId }).update({
        manager_id: newManagerId || null,
        updated_at: new Date(),
      });

      const managerRole = await trx('roles').where({ name: 'department_manager' }).first();
      const employeeRole = await trx('roles').where({ name: 'employee' }).first();

      // إذا كان هناك مدير قديم ولا يدير قسماً آخر، نعيد دوره إلى employee
      if (oldManagerId && oldManagerId !== newManagerId) {
        const managesOther = await trx('departments')
          .where({ manager_id: oldManagerId })
          .whereNot({ id: deptId })
          .first();

        if (!managesOther && managerRole && employeeRole) {
          await trx('user_roles')
            .where({ user_id: oldManagerId, role_id: managerRole.id })
            .delete();
          await trx('user_roles')
            .insert({ user_id: oldManagerId, role_id: employeeRole.id })
            .onConflict(['user_id', 'role_id'])
            .ignore();
        }
      }

      // ترقية المدير الجديد إلى department_manager
      if (newManagerId && managerRole) {
        await trx('user_roles')
          .insert({ user_id: newManagerId, role_id: managerRole.id })
          .onConflict(['user_id', 'role_id'])
          .ignore();

        // التأكد من أن المستخدم ينتمي لنفس القسم
        await trx('users').where({ id: newManagerId }).update({ department_id: deptId });
      }
    });

    return this.getDepartmentById(deptId);
  }
}
