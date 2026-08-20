import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import QuestionPolicy from '#policies/question_policy'
import validateRequest from '#lib/request_validator'
import { updateValidator } from '#validators/question'

@inject()
export default class QuestionUpdateService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { questionId, ...payload } = validateRequest(updateValidator, input)
    const question = await Question.findOrFail(questionId)

    await this.ctx.bouncer.with(QuestionPolicy).authorize('update', question)

    question.merge(payload)
    await question.save()

    return question.serialize()
  }
}
