// seeds/01_departments.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // لا تحذف إذا كانت البيانات موجودة (آمن للتشغيل المتكرر)
  const existing = await knex('departments').count('id as count').first();
  if (existing.count > 0) {
    console.log('⏭️  Departments already seeded, skipping.');
    return;
  }

  await knex('departments').insert([
    {
      name: 'الإدارة التنفيذية',
      slug: 'executive',
      description: 'المدير التنفيذي والإدارة العليا',
      is_active: true,
    },
    {
      name: 'الحسابات',
      slug: 'accounts',
      description: 'قسم الحسابات والمالية',
      is_active: true,
    },
    {
      name: 'المشاريع',
      slug: 'projects',
      description: 'قسم إدارة المشاريع',
      is_active: true,
    },
    {
      name: 'الموارد البشرية',
      slug: 'hr',
      description: 'قسم الموارد البشرية',
      is_active: true,
    },
    {
      name: 'الحماية',
      slug: 'protection',
      description: 'قسم الحماية',
      is_active: true,
    },
    {
      name: 'المخازن واللوجستيات',
      slug: 'logistics',
      description: 'قسم المخازن واللوجستيات',
      is_active: true,
    },
    {
      name: 'الإعلام',
      slug: 'media',
      description: 'قسم الإعلام والتواصل',
      is_active: true,
    },
  ]);

  console.log('✅ Departments seeded successfully.');
}
