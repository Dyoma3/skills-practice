import { RubricSchema } from '#database/schema'
import { beforeSave, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Question from '#models/question'
import { rubricDataValidator } from '#schemas/rubric'
import type { RubricData } from '#schemas/rubric'
import type { RubricTypes } from '#types/index'

export default class Rubric extends RubricSchema {
  declare type: RubricTypes
  declare data: RubricData

  @beforeSave()
  static async validateDataAndDeriveMaxScore(rubric: Rubric) {
    if (rubric.$isLocal || rubric.$dirty.data) {
      rubric.data = await rubricDataValidator.validate(rubric.data)
    }

    rubric.maxScore = Object.values(rubric.data).reduce((total, points) => total + points, 0)
  }

  @hasMany(() => Question)
  declare questions: HasMany<typeof Question>
}
