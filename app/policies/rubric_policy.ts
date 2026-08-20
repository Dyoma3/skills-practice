import User from '#models/user'
import Rubric from '#models/rubric'
import { AuthTokenTypes } from '#types/index'
import { validateTokenAbilities } from '#lib/decorators/validate_token_abilities'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class RubricPolicy extends BasePolicy {
  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  index(_user: User): AuthorizerResponse {
    return true
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:read'] })
  show(_user: User, _rubric: Rubric): AuthorizerResponse {
    return true
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  store(_user: User): AuthorizerResponse {
    return true
  }

  @validateTokenAbilities({ [AuthTokenTypes.Mcp]: ['mcp:write'] })
  delete(_user: User, _rubric: Rubric): AuthorizerResponse {
    return true
  }
}
