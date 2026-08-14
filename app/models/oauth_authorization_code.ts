import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { oauthServer } from '#lib/oauth/server'

type IssueOAuthAuthorizationCodePayload = {
  userId: number
  clientId: string
  redirectUri: string
  resource: string
  scopes: string[]
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

export default class OAuthAuthorizationCode extends BaseModel {
  static table = 'oauth_authorization_codes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column({ serializeAs: null })
  declare codeHash: string

  @column()
  declare clientId: string

  @column()
  declare redirectUri: string

  @column()
  declare resource: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string[] | string) =>
      typeof value === 'string' ? (JSON.parse(value) as string[]) : value,
  })
  declare scopes: string[]

  @column()
  declare codeChallenge: string

  @column()
  declare codeChallengeMethod: 'S256'

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  static async issue(payload: IssueOAuthAuthorizationCodePayload) {
    const code = randomBytes(32).toString('base64url')
    const authorizationCode = await OAuthAuthorizationCode.create({
      ...payload,
      codeHash: this.hash(code),
      expiresAt: DateTime.now().plus({ seconds: oauthServer.authorizationCodeTtlSeconds }),
    })

    return { code, authorizationCode }
  }

  static async consume(code: string) {
    const codeHash = this.hash(code)

    return await db.transaction(async (trx) => {
      const authorizationCode = await OAuthAuthorizationCode.query({ client: trx })
        .where('codeHash', codeHash)
        .forUpdate()
        .first()

      if (!authorizationCode) return null

      await authorizationCode.delete()

      if (authorizationCode.expiresAt.toMillis() <= DateTime.now().toMillis()) return null
      return authorizationCode
    })
  }

  private static hash(code: string) {
    return createHash('sha256').update(code).digest('hex')
  }
}
