import { SkillSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Skill extends SkillSchema {
  @belongsTo(() => Skill, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Skill> | null

  @hasMany(() => Skill, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Skill>
}
