import { BaseSchema } from '@adonisjs/lucid/schema'

const ROOT_SKILL_ID = '00000000-0000-0000-0000-000000000000'

export default class extends BaseSchema {
  protected tableName = 'skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('parent_id')
        .nullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('RESTRICT')
      table.text('name').notNullable()
      table.text('description').notNullable()

      table.index(['user_id', 'parent_id'])
    })

    this.schema.raw(
      `CREATE UNIQUE INDEX skills_user_id_parent_id_name_unique
       ON ${this.tableName} (user_id, COALESCE(parent_id, '${ROOT_SKILL_ID}'::uuid), name)`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
