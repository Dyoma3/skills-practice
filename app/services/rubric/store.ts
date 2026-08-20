import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Rubric from '#models/rubric'
import RubricPolicy from '#policies/rubric_policy'
import validateRequest from '#lib/request_validator'
import { storeValidator } from '#validators/rubric'

@inject()
export default class RubricStoreService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const payload = validateRequest(storeValidator, input)

    await this.ctx.bouncer.with(RubricPolicy).authorize('store')

    const rubric = await Rubric.create(payload)

    return rubric.serialize()
  }
}
