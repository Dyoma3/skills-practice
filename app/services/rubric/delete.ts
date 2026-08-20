import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Rubric from '#models/rubric'
import RubricPolicy from '#policies/rubric_policy'
import BadRequestException from '#exceptions/bad_request'
import validateRequest from '#lib/request_validator'
import { deleteValidator } from '#validators/rubric'

@inject()
export default class RubricDeleteService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { rubricId } = validateRequest(deleteValidator, input)
    const rubric = await Rubric.findOrFail(rubricId)

    await this.ctx.bouncer.with(RubricPolicy).authorize('delete', rubric)

    if (await rubric.related('questions').query().first()) {
      throw new BadRequestException('Cannot delete a rubric referenced by questions')
    }

    await rubric.delete()

    return { id: rubric.id }
  }
}
