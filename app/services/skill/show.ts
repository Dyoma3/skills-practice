import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import validateRequest from '#lib/request_validator'
import { showValidator } from '#validators/skill'

@inject()
export default class SkillShowService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { skillId, includeChildren } = validateRequest(showValidator, input)
    const query = Skill.query().where('id', skillId)

    if (includeChildren) {
      query.preload('children', (childrenQuery) =>
        childrenQuery.where('userId', this.ctx.auth.user!.id)
      )
    }

    const skill = await query.firstOrFail()

    await this.ctx.bouncer.with(SkillPolicy).authorize('show', skill)

    return skill.serialize()
  }
}
