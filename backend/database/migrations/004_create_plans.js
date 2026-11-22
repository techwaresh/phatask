// 004_create_plans.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('plans', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table
      .bigInteger('department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table.enum('type', ['daily', 'weekly', 'monthly']).notNullable().comment('نوع الخطة');
    table.string('title', 255).notNullable().comment('عنوان الخطة');
    table.date('period_start').notNullable().comment('بداية الفترة');
    table.date('period_end').notNullable().comment('نهاية الفترة');
    table
      .enum('status', [
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'revision_requested',
      ])
      .defaultTo('draft')
      .notNullable();
    table.text('notes').nullable().comment('ملاحظات');
    table.timestamp('submitted_at').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().comment('Soft delete');

    // منع تكرار الخطة لنفس المستخدم والنوع والفترة
    table.unique(['user_id', 'type', 'period_start'], 'uq_plans_user_type_period');
    table.index('user_id');
    table.index('department_id');
    table.index('status');
    table.index('period_start');
  });

  await knex.schema.createTable('plan_items', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('plan_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('plans')
      .onDelete('CASCADE');
    table
      .enum('item_type', ['goal', 'activity', 'expected_result'])
      .notNullable()
      .comment('نوع البند');
    table.text('content').notNullable().comment('المحتوى');
    table.integer('order_index').defaultTo(0).comment('الترتيب');
    table
      .tinyint('completion_rate')
      .unsigned()
      .defaultTo(0)
      .comment('نسبة الإنجاز %');
    table.timestamps(true, true);

    table.index('plan_id');
    table.index('item_type');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('plan_items');
  await knex.schema.dropTableIfExists('plans');
}
