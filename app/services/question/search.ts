import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import Skill from '#models/skill'
import QuestionPolicy from '#policies/question_policy'
import validateRequest from '#lib/request_validator'
import { searchValidator } from '#validators/question'

@inject()
export default class QuestionSearchService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { search, skillId, page, pageSize } = validateRequest(searchValidator, input)
    const skill = skillId ? await Skill.findOrFail(skillId) : null

    await this.ctx.bouncer.with(QuestionPolicy).authorize('index', skill)

    const query = Question.query().whereHas('skill', (skillQuery) =>
      skillQuery.where('userId', this.ctx.auth.user!.id)
    )

    if (search) {
      const pattern = `%${search}%`
      query.where((searchQuery) =>
        searchQuery.where('prompt', 'ILIKE', pattern).orWhere('context', 'ILIKE', pattern)
      )
    }

    if (skill) query.where('skillId', skill.id)

    const questions = await query
      .orderBy('prompt', 'asc')
      .orderBy('id', 'asc')
      .paginate(page, pageSize)
    const serialized = questions.serialize()

    return {
      data: serialized.data,
      total: serialized.meta.total,
    }
  }
}
