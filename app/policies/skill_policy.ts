import User from '#models/user'
import Skill from '#models/skill'
import { AuthTokenTypes } from '#types/index'
import { validateTokenAbilities } from '#lib/decorators/validate_token_abilities'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class SkillPolicy extends BasePolicy {
  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  index(_user: User): AuthorizerResponse {
    return true
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  show(user: User, skill: Skill): AuthorizerResponse {
    return skill.userId === user.id
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  store(user: User, parent: Skill | null): AuthorizerResponse {
    return parent === null || parent.userId === user.id
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  delete(user: User, skill: Skill): AuthorizerResponse {
    return skill.userId === user.id
  }
}
