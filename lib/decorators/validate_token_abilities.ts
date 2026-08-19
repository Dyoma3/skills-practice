import type { AccessToken } from '@adonisjs/auth/access_tokens'
import type User from '#models/user'
import type { AuthTokenTypes } from '#types/index'

type TokenAbilitiesConfig = Partial<Record<AuthTokenTypes, readonly string[]>>

type UserWithCurrentAccessToken = User & {
  currentAccessToken?: AccessToken
}

type PolicyMethod = (user: User, ...args: unknown[]) => unknown

export function validateTokenAbilities(
  tokenAbilitiesConfig: TokenAbilitiesConfig
): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as PolicyMethod

    descriptor.value = async function (this: unknown, user: User, ...args: unknown[]) {
      const currentAccessToken = (user as UserWithCurrentAccessToken).currentAccessToken

      if (!currentAccessToken) return originalMethod.apply(this, [user, ...args])

      const requiredAbilities = tokenAbilitiesConfig[currentAccessToken.type as AuthTokenTypes]

      if (requiredAbilities && !hasRequiredAbilities(currentAccessToken, requiredAbilities)) {
        return false
      }

      return originalMethod.apply(this, [user, ...args])
    }

    return descriptor
  }
}

function hasRequiredAbilities(accessToken: AccessToken, abilities: readonly string[]) {
  return abilities.every((ability) => accessToken.abilities.includes(ability))
}
