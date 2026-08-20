import User from '#models/user'
import Attempt from '#models/attempt'
import Question from '#models/question'
import Skill from '#models/skill'
import { AuthTokenTypes } from '#types/index'
import { validateTokenAbilities } from '#lib/decorators/validate_token_abilities'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class AttemptPolicy extends BasePolicy {
  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  async index(
    user: User,
    question: Question | null,
    skill: Skill | null
  ): Promise<AuthorizerResponse> {
    if (skill && skill.userId !== user.id) return false
    return question === null || (await this.questionBelongsToUser(question, user))
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  async show(user: User, attempt: Attempt): Promise<AuthorizerResponse> {
    return Boolean(
      await attempt
        .related('question')
        .query()
        .whereHas('skill', (skillQuery) => skillQuery.where('userId', user.id))
        .select('id')
        .first()
    )
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  async store(user: User, question: Question): Promise<AuthorizerResponse> {
    return this.questionBelongsToUser(question, user)
  }

  private async questionBelongsToUser(question: Question, user: User) {
    return Boolean(
      await question.related('skill').query().where('userId', user.id).select('id').first()
    )
  }
}
