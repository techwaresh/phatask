// database/seeds/04_initial_users.js
import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const existingCount = await knex('users').count('id as count').first();
  if (existingCount.count > 0) {
    console.log('⏭️  Users already seeded, skipping.');
    return;
  }

  const departments = await knex('departments').select('id', 'slug');
  const roles = await knex('roles').select('id', 'name');

  const deptMap = Object.fromEntries(departments.map((d) => [d.slug, d.id]));
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  const INITIAL_STAFF = [
    {
      name: 'محمد صالح القطوي',
      email: 'alktwi@gmail.com',
      role: 'executive_director',
      departmentSlug: 'executive',
      isManager: true,
    },
    {
      name: 'منير منصور حسن الوريش',
      email: 'moneermansoro@gmail.com',
      role: 'department_manager',
      departmentSlug: 'accounts',
      isManager: true,
    },
    {
      name: 'عمار ناجي المرحمي',
      email: 'almarhmy2010@gmail.com',
      role: 'department_manager',
      departmentSlug: 'projects',
      isManager: true,
    },
    {
      name: 'بشار علي قاسم الوريش',
      email: 'wareshtech@gmail.com',
      role: 'employee',
      departmentSlug: 'hr',
      isManager: false,
    },
    {
      name: 'عبدالغني علي محمد المسوري',
      email: 'abuhifa222@gmail.com',
      role: 'employee',
      departmentSlug: 'protection',
      isManager: false,
    },
    {
      name: 'أحمد عبده قاسم الشرعبي',
      email: 'ahmadalsharapii@gmail.com',
      role: 'employee',
      departmentSlug: 'logistics',
      isManager: false,
    },
    {
      name: 'بدر صالح القطوي',
      email: 'badrsaleh852@gmail.com',
      role: 'employee',
      departmentSlug: 'media',
      isManager: false,
    },
    {
      name: 'محمد جابر',
      email: 'mohmdqtwi@gmail.com',
      role: 'employee',
      departmentSlug: 'accounts',
      isManager: false,
    },
  ];

  const defaultPass = process.env.INITIAL_USER_PASSWORD || 'Basmah#2026@Secure';
  const passwordHash = await argon2.hash(defaultPass, {
    type: argon2.argon2id,
  });

  for (const staff of INITIAL_STAFF) {
    const deptId = deptMap[staff.departmentSlug] || null;
    const roleId = roleMap[staff.role];

    const [userId] = await knex('users').insert({
      name: staff.name,
      email: staff.email,
      password_hash: passwordHash,
      department_id: deptId,
      is_active: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (roleId) {
      await knex('user_roles').insert({
        user_id: userId,
        role_id: roleId,
      });
    }

    if (staff.isManager && deptId) {
      await knex('departments').where({ id: deptId }).update({ manager_id: userId });
    }
  }

  console.log('✅ Initial 8 staff users seeded successfully.');
}
