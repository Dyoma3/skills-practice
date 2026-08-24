import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'questions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('difficulty')
        .notNullable()
        .defaultTo(1)
        .checkPositive('questions_difficulty_positive')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('difficulty')
    })
  }
}
