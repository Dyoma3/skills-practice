import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Rubric from '#models/rubric'
import RubricPolicy from '#policies/rubric_policy'
import validateRequest from '#lib/request_validator'
import { searchValidator } from '#validators/rubric'

@inject()
export default class RubricSearchService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { search, type, page, pageSize } = validateRequest(searchValidator, input)

    await this.ctx.bouncer.with(RubricPolicy).authorize('index')

    const query = Rubric.query()

    if (search) {
      const pattern = `%${search}%`
      query.where((searchQuery) =>
        searchQuery.where('name', 'ILIKE', pattern).orWhere('description', 'ILIKE', pattern)
      )
    }

    if (type) query.where('type', type)

    const rubrics = await query.orderBy('name', 'asc').orderBy('id', 'asc').paginate(page, pageSize)
    const serialized = rubrics.serialize()

    return {
      data: serialized.data,
      total: serialized.meta.total,
    }
  }
}
