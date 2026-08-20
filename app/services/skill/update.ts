import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import validateRequest from '#lib/request_validator'
import { updateValidator } from '#validators/skill'

@inject()
export default class SkillUpdateService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { skillId, ...payload } = validateRequest(updateValidator, input)
    const skill = await Skill.findOrFail(skillId)

    await this.ctx.bouncer.with(SkillPolicy).authorize('update', skill)

    skill.merge(payload)
    await skill.save()

    return skill.serialize()
  }
}
