// 006_create_reports.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('reports', (table) => {
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
    table.enum('type', ['daily', 'weekly', 'monthly']).notNullable().comment('نوع التقرير');
    table.string('title', 255).notNullable().comment('عنوان التقرير');
    table.date('period_start').notNullable().comment('بداية الفترة');
    table.date('period_end').notNullable().comment('نهاية الفترة');
    table.longText('content').nullable().comment('المحتوى الكامل');
    table
      .boolean('is_auto_generated')
      .defaultTo(false)
      .comment('هل تم إنشاؤه تلقائياً');
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
    table.timestamp('submitted_at').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().comment('Soft delete');

    // منع تكرار التقرير لنفس المستخدم والنوع والفترة
    table.unique(['user_id', 'type', 'period_start'], 'uq_reports_user_type_period');
    table.index('user_id');
    table.index('department_id');
    table.index('status');
    table.index('period_start');
  });

  // ربط التقارير بالمهام
  await knex.schema.createTable('report_tasks', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('report_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('reports')
      .onDelete('CASCADE');
    table
      .bigInteger('task_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('RESTRICT');
    table.text('notes').nullable().comment('ملاحظة الموظف على المهمة في التقرير');

    table.unique(['report_id', 'task_id']);
    table.index('report_id');
    table.index('task_id');
  });

  // مرفقات التقارير
  await knex.schema.createTable('report_attachments', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('report_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('reports')
      .onDelete('CASCADE');
    table
      .bigInteger('file_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('files')
      .onDelete('RESTRICT');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('report_id');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('report_attachments');
  await knex.schema.dropTableIfExists('report_tasks');
  await knex.schema.dropTableIfExists('reports');
}
