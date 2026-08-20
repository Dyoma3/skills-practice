import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import QuestionPolicy from '#policies/question_policy'
import BadRequestException from '#exceptions/bad_request'
import validateRequest from '#lib/request_validator'
import { deleteValidator } from '#validators/question'

@inject()
export default class QuestionDeleteService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { questionId } = validateRequest(deleteValidator, input)
    const question = await Question.findOrFail(questionId)

    await this.ctx.bouncer.with(QuestionPolicy).authorize('delete', question)

    if (await question.related('attempts').query().first()) {
      throw new BadRequestException('Cannot delete a question with attempts')
    }

    await question.delete()

    return { id: question.id }
  }
}
