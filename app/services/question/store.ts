import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Skill from '#models/skill'
import Rubric from '#models/rubric'
import QuestionPolicy from '#policies/question_policy'
import BadRequestException from '#exceptions/bad_request'
import validateRequest from '#lib/request_validator'
import { storeValidator } from '#validators/question'

@inject()
export default class QuestionStoreService {
  constructor(private ctx: HttpContext) {}

  async execute(input: unknown) {
    const { skillId, rubricId, prompt, context, answer } = validateRequest(storeValidator, input)
    const skill = await Skill.findOrFail(skillId)

    await this.ctx.bouncer.with(QuestionPolicy).authorize('store', skill)

    if (await skill.related('children').query().first()) {
      throw new BadRequestException('Questions can only be added to leaf skills')
    }

    const rubric = await Rubric.findOrFail(rubricId)
    const question = await skill.related('questions').create({
      rubricId: rubric.id,
      prompt,
      context: context ?? null,
      answer: answer ?? null,
    })

    return question.serialize()
  }
}
