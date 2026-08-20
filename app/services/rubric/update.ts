import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Rubric from '#models/rubric'
import RubricPolicy from '#policies/rubric_policy'
import validateRequest from '#lib/request_validator'
import { updateValidator } from '#validators/rubric'

@inject()
export default class RubricUpdateService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { rubricId, ...payload } = validateRequest(updateValidator, input)
    const rubric = await Rubric.findOrFail(rubricId)

    await this.ctx.bouncer.with(RubricPolicy).authorize('update', rubric)

    rubric.merge(payload)
    await rubric.save()

    return rubric.serialize()
  }
}
