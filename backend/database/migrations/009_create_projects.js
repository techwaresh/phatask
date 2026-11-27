// 009_create_projects.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. جدول المشاريع الرئيسي
  await knex.schema.createTable('projects', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('code', 50).unique().notNullable().comment('كود المشروع مثلا PRJ-2026-001');
    table.string('name', 255).notNullable().comment('اسم المشروع');
    table.string('donor', 255).notNullable().comment('الجهة الداعمة / المانح');
    table.text('description').nullable().comment('صياغة المشروع وتفاصيله');
    table.string('location', 255).notNullable().comment('مكان التنفيذ - المحافظة/المديرية');
    table.date('start_date').notNullable().comment('تاريخ بدء التنفيذ');
    table.date('end_date').notNullable().comment('تاريخ انتهاء التنفيذ');
    table.decimal('total_budget', 15, 2).notNullable().comment('مبلغ الاعتماد الإجمالي');
    table.string('currency', 10).defaultTo('USD').comment('العملة');
    
    // المراحل السبع المعتمدة
    table
      .enum('current_stage', [
        'intake',             // 1. وصول المشروع والاعتماد
        'financial_analysis', // 2. التحليل المالي والموازنة
        'procurement',        // 3. عروض الأسعار والمشتريات
        'field_execution',    // 4. التخطيط الميداني والتنفيذ
        'media_production',   // 5. التوثيق الإعلامي والمونتاج
        'evaluation',         // 6. المتابعة والتقييم وإغلاق المشروع
        'donor_handover',     // 7. حزمة الجهة الداعمة
        'completed',          // مكتمل ومؤرشف
      ])
      .defaultTo('intake')
      .notNullable();

    table
      .enum('status', ['active', 'on_hold', 'completed', 'cancelled'])
      .defaultTo('active')
      .notNullable();

    table
      .bigInteger('created_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table
      .bigInteger('manager_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    table.index('code');
    table.index('current_stage');
    table.index('status');
    table.index('created_by');
    table.index('manager_id');
  });

  // 2. جدول بيانات المراحل التراكمية (بيانات مالية، لوجستية، ميدانية، إعلامية، تقييم)
  await knex.schema.createTable('project_stages_data', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.string('stage', 50).notNullable(); // financial, procurement, field, media, evaluation, donor_package
    table.json('data').notNullable().comment('بيانات المرحلة بتنسيق JSON');
    table
      .bigInteger('submitted_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.unique(['project_id', 'stage']);
    table.index('project_id');
    table.index('stage');
  });

  // 3. جدول مرفقات ومستندات المشروع
  await knex.schema.createTable('project_files', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table
      .bigInteger('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.string('stage', 50).notNullable(); // intake, financial, quotation, po, goods_receipt, permit, beneficiaries, photo, video, technical_report, receipt_voucher
    table.string('file_name', 255).notNullable();
    table.string('file_url', 500).notNullable();
    table.integer('file_size').unsigned().nullable();
    table.string('mime_type', 100).nullable();
    table
      .bigInteger('uploaded_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamps(true, true);

    table.index('project_id');
    table.index('stage');
  });

  // 4. ربط جدول المهام tasks مع جدول المشاريع projects
  await knex.schema.alterTable('tasks', (table) => {
    table
      .bigInteger('project_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('projects')
      .onDelete('SET NULL')
      .comment('المشروع المرتبط بالمهمة');

    table.index('project_id');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.dropForeign('project_id');
    table.dropIndex('project_id');
    table.dropColumn('project_id');
  });

  await knex.schema.dropTableIfExists('project_files');
  await knex.schema.dropTableIfExists('project_stages_data');
  await knex.schema.dropTableIfExists('projects');
}
