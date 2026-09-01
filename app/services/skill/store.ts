import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import validateRequest from '#lib/request_validator'
import { storeValidator } from '#validators/skill'

@inject()
export default class SkillStoreService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { parentId, name, description } = validateRequest(storeValidator, input)
    const parent = parentId ? await Skill.findOrFail(parentId) : null

    await this.ctx.bouncer.with(SkillPolicy).authorize('store', parent)

    const skill = await this.ctx.auth.user!.related('skills').create({
      parentId: parent?.id ?? null,
      name,
      description,
    })

    return skill.serialize()
  }
}
