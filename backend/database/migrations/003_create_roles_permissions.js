// 003_create_roles_permissions.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // جدول الأدوار
  await knex.schema.createTable('roles', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .enum('name', ['executive_director', 'department_manager', 'employee'])
      .unique()
      .notNullable();
    table.string('display_name', 100).notNullable().comment('الاسم بالعربية');
    table.timestamps(true, true);
  });

  // جدول الصلاحيات
  await knex.schema.createTable('permissions', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('name', 100).unique().notNullable().comment('مثل: plans.create');
    table.string('module', 50).notNullable().comment('الوحدة');
    table.string('description', 255).nullable();
  });

  // ربط المستخدمين بالأدوار
  await knex.schema.createTable('user_roles', (table) => {
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .bigInteger('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table.primary(['user_id', 'role_id']);
  });

  // ربط الأدوار بالصلاحيات
  await knex.schema.createTable('role_permissions', (table) => {
    table
      .bigInteger('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table
      .bigInteger('permission_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table.primary(['role_id', 'permission_id']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
}
