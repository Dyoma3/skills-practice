import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Attempt from '#models/attempt'
import AttemptPolicy from '#policies/attempt_policy'
import validateRequest from '#lib/request_validator'
import { showValidator } from '#validators/attempt'

@inject()
export default class AttemptShowService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { attemptId } = validateRequest(showValidator, input)
    const attempt = await Attempt.query()
      .where('id', attemptId)
      .preload('question', (questionQuery) => questionQuery.preload('rubric'))
      .firstOrFail()

    await this.ctx.bouncer.with(AttemptPolicy).authorize('show', attempt)

    return attempt.serialize()
  }
}
