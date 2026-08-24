import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('skills', (table) => {
      table.dropForeign(['parent_id'])
      table.foreign('parent_id').references('id').inTable('skills').onDelete('CASCADE')
    })

    this.schema.alterTable('questions', (table) => {
      table.dropForeign(['skill_id'])
      table.foreign('skill_id').references('id').inTable('skills').onDelete('CASCADE')
    })

    this.schema.alterTable('attempts', (table) => {
      table.dropForeign(['question_id'])
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable('attempts', (table) => {
      table.dropForeign(['question_id'])
      table.foreign('question_id').references('id').inTable('questions').onDelete('RESTRICT')
    })

    this.schema.alterTable('questions', (table) => {
      table.dropForeign(['skill_id'])
      table.foreign('skill_id').references('id').inTable('skills').onDelete('RESTRICT')
    })

    this.schema.alterTable('skills', (table) => {
      table.dropForeign(['parent_id'])
      table.foreign('parent_id').references('id').inTable('skills').onDelete('RESTRICT')
    })
  }
}
