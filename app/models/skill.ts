import { SkillSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Question from '#models/question'
import User from '#models/user'

export default class Skill extends SkillSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Skill, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Skill> | null

  @hasMany(() => Skill, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Skill>

  @hasMany(() => Question)
  declare questions: HasMany<typeof Question>
}
