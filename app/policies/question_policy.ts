import User from '#models/user'
import Question from '#models/question'
import Skill from '#models/skill'
import { AuthTokenTypes } from '#types/index'
import { validateTokenAbilities } from '#lib/decorators/validate_token_abilities'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class QuestionPolicy extends BasePolicy {
  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  index(user: User, skill: Skill | null): AuthorizerResponse {
    return skill === null || skill.userId === user.id
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  async show(user: User, question: Question): Promise<AuthorizerResponse> {
    return Boolean(
      await question.related('skill').query().where('userId', user.id).select('id').first()
    )
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  store(user: User, skill: Skill): AuthorizerResponse {
    return skill.userId === user.id
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  async delete(user: User, question: Question): Promise<AuthorizerResponse> {
    return Boolean(
      await question.related('skill').query().where('userId', user.id).select('id').first()
    )
  }
}
