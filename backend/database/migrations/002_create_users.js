// 002_create_users.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('name', 150).notNullable().comment('الاسم الكامل');
    table.string('email', 191).unique().notNullable().comment('البريد الإلكتروني');
    table.string('password_hash', 255).notNullable().comment('Argon2id hash');
    table
      .bigInteger('department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true).comment('هل الحساب نشط');
    table.string('avatar_url', 500).nullable().comment('رابط الصورة الشخصية');
    table.timestamp('last_login_at').nullable();
    table.timestamp('email_verified_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().comment('Soft delete');

    table.index('email');
    table.index('department_id');
    table.index('is_active');
  });

  // الآن نضيف FK manager_id في departments → users
  await knex.schema.alterTable('departments', (table) => {
    table
      .bigInteger('manager_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('departments', (table) => {
    table.dropForeign('manager_id');
  });
  await knex.schema.dropTableIfExists('users');
}
