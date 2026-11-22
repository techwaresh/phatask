// seeds/02_roles_permissions.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const existing = await knex('roles').count('id as count').first();
  if (existing.count > 0) {
    console.log('⏭️  Roles already seeded, skipping.');
    return;
  }

  // الأدوار
  await knex('roles').insert([
    { name: 'executive_director', display_name: 'المدير التنفيذي' },
    { name: 'department_manager', display_name: 'مدير القسم' },
    { name: 'employee', display_name: 'موظف' },
  ]);

  // الصلاحيات
  const permissions = [
    // Dashboard
    { name: 'dashboard.executive', module: 'dashboard', description: 'لوحة المدير التنفيذي' },
    { name: 'dashboard.employee', module: 'dashboard', description: 'لوحة الموظف' },
    { name: 'dashboard.department', module: 'dashboard', description: 'لوحة القسم' },

    // Users
    { name: 'users.list', module: 'users', description: 'عرض قائمة المستخدمين' },
    { name: 'users.view', module: 'users', description: 'عرض مستخدم' },
    { name: 'users.create', module: 'users', description: 'إنشاء مستخدم' },
    { name: 'users.edit', module: 'users', description: 'تعديل مستخدم' },
    { name: 'users.deactivate', module: 'users', description: 'تعطيل حساب' },

    // Departments
    { name: 'departments.list', module: 'departments', description: 'عرض الأقسام' },
    { name: 'departments.edit', module: 'departments', description: 'تعديل قسم' },
    { name: 'departments.set_manager', module: 'departments', description: 'تعيين مدير قسم' },

    // Plans
    { name: 'plans.create', module: 'plans', description: 'إنشاء خطة' },
    { name: 'plans.view_own', module: 'plans', description: 'عرض خططي' },
    { name: 'plans.view_department', module: 'plans', description: 'عرض خطط القسم' },
    { name: 'plans.view_all', module: 'plans', description: 'عرض جميع الخطط' },
    { name: 'plans.approve', module: 'plans', description: 'اعتماد خطة' },

    // Tasks
    { name: 'tasks.create', module: 'tasks', description: 'إنشاء مهمة' },
    { name: 'tasks.assign', module: 'tasks', description: 'إسناد مهمة' },
    { name: 'tasks.assign_any', module: 'tasks', description: 'إسناد لأي موظف' },
    { name: 'tasks.view_own', module: 'tasks', description: 'عرض مهامي' },
    { name: 'tasks.view_department', module: 'tasks', description: 'عرض مهام القسم' },
    { name: 'tasks.view_all', module: 'tasks', description: 'عرض جميع المهام' },
    { name: 'tasks.approve', module: 'tasks', description: 'اعتماد مهمة' },

    // Reports
    { name: 'reports.create', module: 'reports', description: 'إنشاء تقرير' },
    { name: 'reports.auto_generate', module: 'reports', description: 'إنشاء تقرير تلقائي' },
    { name: 'reports.view_own', module: 'reports', description: 'عرض تقاريري' },
    { name: 'reports.view_department', module: 'reports', description: 'عرض تقارير القسم' },
    { name: 'reports.view_all', module: 'reports', description: 'عرض جميع التقارير' },
    { name: 'reports.approve', module: 'reports', description: 'اعتماد تقرير' },

    // Admin
    { name: 'admin.activity_logs', module: 'admin', description: 'سجل النشاطات' },
    { name: 'admin.system_settings', module: 'admin', description: 'إعدادات النظام' },
    { name: 'admin.approvals_all', module: 'admin', description: 'إدارة جميع الاعتمادات' },
  ];

  await knex('permissions').insert(permissions);

  // ربط الصلاحيات بالأدوار
  const roles = await knex('roles').select('id', 'name');
  const perms = await knex('permissions').select('id', 'name');

  const permByName = perms.reduce((acc, p) => ({ ...acc, [p.name]: p.id }), {});
  const roleByName = roles.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

  const edPerms = perms.map((p) => ({ role_id: roleByName.executive_director, permission_id: p.id }));

  const managerPerms = [
    'dashboard.employee', 'dashboard.department',
    'plans.create', 'plans.view_own', 'plans.view_department', 'plans.approve',
    'tasks.create', 'tasks.assign', 'tasks.view_own', 'tasks.view_department', 'tasks.approve',
    'reports.create', 'reports.auto_generate', 'reports.view_own', 'reports.view_department', 'reports.approve',
    'departments.list',
    'users.view',
  ].map((name) => ({ role_id: roleByName.department_manager, permission_id: permByName[name] }));

  const employeePerms = [
    'dashboard.employee',
    'plans.create', 'plans.view_own',
    'tasks.create', 'tasks.view_own',
    'reports.create', 'reports.auto_generate', 'reports.view_own',
    'departments.list',
  ].map((name) => ({ role_id: roleByName.employee, permission_id: permByName[name] }));

  await knex('role_permissions').insert([...edPerms, ...managerPerms, ...employeePerms]);

  console.log('✅ Roles & Permissions seeded successfully.');
}
