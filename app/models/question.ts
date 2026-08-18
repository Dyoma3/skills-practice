import { QuestionSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Attempt from '#models/attempt'
import Rubric from '#models/rubric'
import Skill from '#models/skill'

export default class Question extends QuestionSchema {
  @belongsTo(() => Skill)
  declare skill: BelongsTo<typeof Skill>

  @belongsTo(() => Rubric)
  declare rubric: BelongsTo<typeof Rubric>

  @hasMany(() => Attempt)
  declare attempts: HasMany<typeof Attempt>
}
