// 007_create_approvals_notifications.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // خطوات الاعتماد
  await knex.schema.createTable('approval_steps', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .enum('entity_type', ['plan', 'report', 'task'])
      .notNullable()
      .comment('نوع الكيان');
    table.bigInteger('entity_id').unsigned().notNullable().comment('معرف الكيان');
    table
      .tinyint('step_order')
      .unsigned()
      .notNullable()
      .comment('1=مدير قسم، 2=مدير تنفيذي');
    table
      .bigInteger('approver_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .comment('المعتمد');
    table
      .enum('status', ['pending', 'approved', 'rejected', 'revision_requested'])
      .defaultTo('pending')
      .notNullable();
    table.text('notes').nullable().comment('سبب الرفض أو الإعادة');
    table.timestamp('acted_at').nullable().comment('وقت القرار');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['entity_type', 'entity_id']);
    table.index('approver_id');
    table.index('status');
  });

  // الإشعارات
  await knex.schema.createTable('notifications', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .comment('المستلم');
    table.string('type', 100).notNullable().comment('نوع الإشعار');
    table.string('title', 255).notNullable().comment('عنوان الإشعار');
    table.text('body').nullable().comment('نص الإشعار');
    table.string('related_entity_type', 50).nullable();
    table.bigInteger('related_entity_id').unsigned().nullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('is_read');
    table.index('created_at');
  });

  // سجل إرسال الإشعارات
  await knex.schema.createTable('notification_logs', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('notification_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('notifications')
      .onDelete('CASCADE');
    table.enum('channel', ['in_app', 'email']).notNullable();
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.timestamp('sent_at').nullable();
    table.text('error_message').nullable();

    table.index('notification_id');
    table.index('status');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('notification_logs');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('approval_steps');
}
