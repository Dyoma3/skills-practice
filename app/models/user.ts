import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { AuthTokenTypes } from '#types/index'

export default class User extends compose(
  UserSchema,
  withAuthFinder(() => hash.use())
) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  static mcpAccessTokens = DbAccessTokensProvider.forModel(User, {
    type: AuthTokenTypes.Mcp,
  })
  declare currentAccessToken?: AccessToken

  get initials() {
    if (this.firstName && this.lastName) {
      return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase()
    }

    const name = this.firstName || this.lastName
    if (name) return name.slice(0, 2).toUpperCase()

    const [localPart, domain] = this.email.split('@')
    return `${localPart.charAt(0)}${domain.charAt(0)}`.toUpperCase()
  }
}
