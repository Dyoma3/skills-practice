import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import AttemptPolicy from '#policies/attempt_policy'
import BadRequestException from '#exceptions/bad_request'
import validateRequest from '#lib/request_validator'
import { storeValidator } from '#validators/attempt'

@inject()
export default class AttemptStoreService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { questionId, response, fulfilledCriteria, feedback } = validateRequest(
      storeValidator,
      input
    )

    const question = await Question.query().where('id', questionId).preload('rubric').firstOrFail()

    await this.ctx.bouncer.with(AttemptPolicy).authorize('store', question)

    const unknownCriteria = fulfilledCriteria.filter(
      (criterion) => !Object.hasOwn(question.rubric.data, criterion)
    )

    if (unknownCriteria.length > 0) {
      throw new BadRequestException(`Unknown rubric criteria: ${unknownCriteria.join(', ')}`)
    }

    const score = fulfilledCriteria.reduce(
      (total, criterion) => total + question.rubric.data[criterion],
      0
    )
    const attempt = await question.related('attempts').create({
      response,
      score,
      feedback: feedback ?? null,
    })

    return attempt.serialize()
  }
}
