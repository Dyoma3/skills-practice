import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import SkillPolicy from '#policies/skill_policy'
import validateRequest from '#lib/request_validator'
import { searchValidator } from '#validators/skill'

@inject()
export default class SkillSearchService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { search, page, pageSize } = validateRequest(searchValidator, input)

    await this.ctx.bouncer.with(SkillPolicy).authorize('index')

    const pattern = `%${search}%`
    const skills = await Skill.query()
      .where('userId', this.ctx.auth.user!.id)
      .where((query) =>
        query.where('name', 'ILIKE', pattern).orWhere('description', 'ILIKE', pattern)
      )
      .orderBy('name', 'asc')
      .orderBy('id', 'asc')
      .paginate(page, pageSize)
    const serialized = skills.serialize()

    return {
      data: serialized.data,
      total: serialized.meta.total,
    }
  }
}
