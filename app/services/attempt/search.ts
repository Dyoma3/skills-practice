import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Attempt from '#models/attempt'
import Question from '#models/question'
import Skill from '#models/skill'
import AttemptPolicy from '#policies/attempt_policy'
import validateRequest from '#lib/request_validator'
import { searchValidator } from '#validators/attempt'

@inject()
export default class AttemptSearchService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { questionId, skillId, page, pageSize } = validateRequest(searchValidator, input)
    const question = questionId ? await Question.findOrFail(questionId) : null
    const skill = skillId ? await Skill.findOrFail(skillId) : null

    await this.ctx.bouncer.with(AttemptPolicy).authorize('index', question, skill)

    const query = Attempt.query().whereHas('question', (questionQuery) =>
      questionQuery.whereHas('skill', (skillQuery) =>
        skillQuery.where('userId', this.ctx.auth.user!.id)
      )
    )

    if (question) query.where('questionId', question.id)
    if (skill) {
      query.whereHas('question', (questionQuery) => questionQuery.where('skillId', skill.id))
    }

    const attempts = await query
      .orderBy('attempts.created_at', 'desc')
      .orderBy('attempts.id', 'desc')
      .paginate(page, pageSize)
    const serialized = attempts.serialize()

    return {
      data: serialized.data,
      total: serialized.meta.total,
    }
  }
}
