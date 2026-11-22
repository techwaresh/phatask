// seeds/03_system_settings.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const existing = await knex('system_settings').count('id as count').first();
  if (existing.count > 0) {
    console.log('⏭️  System settings already seeded, skipping.');
    return;
  }

  await knex('system_settings').insert([
    {
      key: 'org_name',
      value: 'مؤسسة بصمة للأعمال الإنسانية',
      description: 'اسم المؤسسة',
    },
    {
      key: 'org_name_en',
      value: 'Basmah Humanitarian Organization',
      description: 'اسم المؤسسة بالإنجليزية',
    },
    {
      key: 'timezone',
      value: 'Asia/Aden',
      description: 'المنطقة الزمنية',
    },
    {
      key: 'work_days',
      value: JSON.stringify([0, 1, 2, 3, 4]), // الأحد=0, الاثنين=1, ... الخميس=4
      description: 'أيام العمل (0=الأحد، 6=السبت)',
    },
    {
      key: 'max_file_size_mb',
      value: '10',
      description: 'الحد الأقصى لحجم الملف (MB)',
    },
    {
      key: 'allowed_file_types',
      value: JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
      description: 'أنواع الملفات المسموح بها',
    },
    {
      key: 'daily_report_auto_generate_time',
      value: '17:00',
      description: 'وقت الإنشاء التلقائي للتقرير اليومي',
    },
    {
      key: 'task_due_reminder_days',
      value: '2',
      description: 'عدد أيام التذكير قبل موعد تسليم المهمة',
    },
  ]);

  console.log('✅ System settings seeded successfully.');
}
