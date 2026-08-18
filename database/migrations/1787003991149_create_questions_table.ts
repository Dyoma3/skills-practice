import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'questions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('RESTRICT')
      table.uuid('rubric_id').notNullable().references('id').inTable('rubrics').onDelete('RESTRICT')
      table.text('prompt').notNullable()
      table.text('context').nullable()
      table.text('answer').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
