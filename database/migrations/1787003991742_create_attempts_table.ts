import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attempts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('question_id')
        .notNullable()
        .references('id')
        .inTable('questions')
        .onDelete('RESTRICT')
      table.text('response').notNullable()
      table.integer('score').notNullable()
      table.text('feedback').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['question_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
