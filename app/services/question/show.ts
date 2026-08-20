import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import QuestionPolicy from '#policies/question_policy'
import validateRequest from '#lib/request_validator'
import { showValidator } from '#validators/question'

@inject()
export default class QuestionShowService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { questionId } = validateRequest(showValidator, input)
    const question = await Question.findOrFail(questionId)

    await this.ctx.bouncer.with(QuestionPolicy).authorize('show', question)

    await question.load('rubric')

    return question.serialize()
  }
}
