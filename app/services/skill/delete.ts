import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import validateRequest from '#lib/request_validator'
import { deleteValidator } from '#validators/skill'

@inject()
export default class SkillDeleteService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { skillId } = validateRequest(deleteValidator, input)
    const skill = await Skill.findOrFail(skillId)

    await this.ctx.bouncer.with(SkillPolicy).authorize('delete', skill)

    await skill.delete()

    return { id: skill.id }
  }
}
