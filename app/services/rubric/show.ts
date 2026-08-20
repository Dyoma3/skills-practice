import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Rubric from '#models/rubric'
import RubricPolicy from '#policies/rubric_policy'
import validateRequest from '#lib/request_validator'
import { showValidator } from '#validators/rubric'

@inject()
export default class RubricShowService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { rubricId } = validateRequest(showValidator, input)
    const rubric = await Rubric.findOrFail(rubricId)

    await this.ctx.bouncer.with(RubricPolicy).authorize('show', rubric)

    return rubric.serialize()
  }
}
