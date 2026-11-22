// 005_create_tasks.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // جدول الملفات (قبل المهام لأن المرفقات ترتبط به)
  await knex.schema.createTable('files', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('uploaded_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table.string('original_name', 255).notNullable().comment('الاسم الأصلي');
    table.string('storage_key', 500).notNullable().comment('مفتاح Cloudinary');
    table.string('storage_provider', 50).defaultTo('cloudinary');
    table.string('mime_type', 100).notNullable();
    table.integer('file_size').unsigned().notNullable().comment('الحجم بالبايت');
    table.string('public_url', 500).nullable().comment('رابط عام');
    table.timestamps(true, true);

    table.index('uploaded_by');
  });

  // جدول المهام
  await knex.schema.createTable('tasks', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('title', 255).notNullable().comment('عنوان المهمة');
    table.text('description').nullable().comment('وصف المهمة');
    table
      .bigInteger('created_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table
      .bigInteger('assigned_to')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .bigInteger('department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table
      .bigInteger('plan_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('plans')
      .onDelete('SET NULL')
      .comment('الخطة المرتبطة');
    table
      .enum('priority', ['low', 'medium', 'high', 'urgent'])
      .defaultTo('medium')
      .notNullable();
    table
      .enum('status', [
        'pending',
        'in_progress',
        'completed',
        'under_review',
        'approved',
        'rejected',
        'cancelled',
      ])
      .defaultTo('pending')
      .notNullable();
    table
      .tinyint('completion_rate')
      .unsigned()
      .defaultTo(0)
      .comment('نسبة الإنجاز %');
    table.date('due_date').notNullable().comment('موعد التسليم');
    table.timestamp('completed_at').nullable();
    table.timestamp('approved_at').nullable();
    table
      .bigInteger('approved_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable().comment('Soft delete');

    table.index('assigned_to');
    table.index('created_by');
    table.index('department_id');
    table.index('status');
    table.index('due_date');
    table.index('plan_id');
  });

  // تعليقات المهام
  await knex.schema.createTable('task_comments', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('task_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table.text('content').notNullable().comment('نص التعليق');
    table.timestamps(true, true);

    table.index('task_id');
  });

  // سجل تعديلات المهام
  await knex.schema.createTable('task_history', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('task_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .bigInteger('changed_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table.string('field_name', 100).notNullable().comment('الحقل الذي تغير');
    table.text('old_value').nullable().comment('القيمة القديمة');
    table.text('new_value').nullable().comment('القيمة الجديدة');
    table.text('change_reason').nullable().comment('سبب التغيير');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('task_id');
    table.index('changed_by');
  });

  // مرفقات المهام
  await knex.schema.createTable('task_attachments', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('task_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE');
    table
      .bigInteger('file_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('files')
      .onDelete('RESTRICT');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('task_id');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('task_attachments');
  await knex.schema.dropTableIfExists('task_history');
  await knex.schema.dropTableIfExists('task_comments');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('files');
}
