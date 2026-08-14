import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_authorization_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('code_hash', 64).notNullable().unique()
      table.string('client_id').notNullable()
      table.text('redirect_uri').notNullable()
      table.text('resource').notNullable()
      table.jsonb('scopes').notNullable()
      table.string('code_challenge', 128).notNullable()
      table.string('code_challenge_method', 16).notNullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['user_id'])
      table.index(['expires_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
