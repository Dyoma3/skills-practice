import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rubrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.text('type').notNullable()
      table.text('name').notNullable().unique()
      table.text('description').notNullable()
      table.integer('max_score').notNullable()
      table.jsonb('data').notNullable()

      table.index(['type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
