import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import BadRequestException from '#exceptions/bad_request'
import validateRequest from '#lib/request_validator'
import { deleteValidator } from '#validators/skill'

@inject()
export default class SkillDeleteService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { skillId } = validateRequest(deleteValidator, input)
    const skill = await Skill.findOrFail(skillId)

    await this.ctx.bouncer.with(SkillPolicy).authorize('delete', skill)

    if (await skill.related('children').query().first()) {
      throw new BadRequestException('Cannot delete a skill with children')
    }

    if (await skill.related('questions').query().first()) {
      throw new BadRequestException('Cannot delete a skill with questions')
    }

    await skill.delete()

    return { id: skill.id }
  }
}
