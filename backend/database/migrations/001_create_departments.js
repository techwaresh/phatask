// 001_create_departments.js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('departments', (table) => {
    table.bigIncrements('id').unsigned().primary();
    table.string('name', 100).notNullable().comment('اسم القسم');
    table.string('slug', 100).unique().notNullable().comment('مختصر فريد');
    table.bigInteger('manager_id').unsigned().nullable().comment('مدير القسم - FK يُضاف بعد users');
    table.text('description').nullable().comment('وصف القسم');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('departments');
}
