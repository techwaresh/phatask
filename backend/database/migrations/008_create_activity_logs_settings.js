// 008_create_activity_logs_settings.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // سجل النشاطات
  await knex.schema.createTable('activity_logs', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('action', 100).notNullable().comment('الفعل (created, updated, approved…)');
    table.string('entity_type', 50).notNullable().comment('نوع الكيان');
    table.bigInteger('entity_id').unsigned().nullable().comment('معرف الكيان');
    table.text('description').nullable().comment('وصف العملية');
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('entity_type');
    table.index('created_at');
  });

  // إعادة تعيين كلمة المرور
  await knex.schema.createTable('password_resets', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('token_hash', 255).notNullable().comment('هاش التوكن');
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_id');
  });

  // إعدادات النظام
  await knex.schema.createTable('system_settings', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('key', 100).unique().notNullable().comment('مفتاح الإعداد');
    table.text('value').nullable().comment('القيمة');
    table.string('description', 255).nullable().comment('الوصف');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('system_settings');
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('activity_logs');
}
