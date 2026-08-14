import { createHash, timingSafeEqual } from 'node:crypto'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import BadRequestException from '#exceptions/bad_request'
import OAuthAuthorizationCode from '#models/oauth_authorization_code'
import User from '#models/user'
import { getOAuthResource } from '#lib/oauth/resources'
import { oauthServer } from '#lib/oauth/server'
import validateRequest from '#lib/request_validator'
import { tokenValidator } from '#validators/oauth'

type TokenPayload = z.infer<typeof tokenValidator>

@inject()
export default class OauthTokenService {
  constructor(protected ctx: HttpContext) {}

  async execute() {
    this.disableCaching()

    const payload = this.getPayload()
    if (!payload) return this.invalidRequestResponse()

    const authorizationCode = await OAuthAuthorizationCode.consume(payload.code)
    if (!authorizationCode) return this.invalidGrantResponse()

    const authorizationResource = getOAuthResource(authorizationCode.resource)
    if (!authorizationResource) return this.invalidGrantResponse()

    const client = authorizationResource.clients.find(
      (candidate) => candidate.id === payload.client_id
    )

    if (!client) return this.invalidClientResponse()
    if (payload.client_id !== authorizationCode.clientId) return this.invalidGrantResponse()
    if (payload.redirect_uri !== authorizationCode.redirectUri) return this.invalidGrantResponse()
    if (payload.resource !== authorizationCode.resource) return this.invalidGrantResponse()
    if (authorizationCode.codeChallengeMethod !== 'S256') return this.invalidGrantResponse()
    if (!this.isValidPkceVerifier(payload, authorizationCode.codeChallenge)) {
      return this.invalidGrantResponse()
    }

    const user = await User.find(authorizationCode.userId)
    if (!user) return this.invalidGrantResponse()

    const accessToken = await User.mcpAccessTokens.create(user, authorizationCode.scopes, {
      name: `oauth:${authorizationCode.clientId}`,
      expiresIn: oauthServer.accessTokenTtlSeconds,
    })

    return this.ctx.response.ok({
      access_token: accessToken.value!.release(),
      token_type: 'Bearer',
      expires_in: oauthServer.accessTokenTtlSeconds,
      scope: authorizationCode.scopes.join(' '),
    })
  }

  private getPayload() {
    try {
      return validateRequest(tokenValidator, this.ctx.request.body())
    } catch (error) {
      if (error instanceof BadRequestException) return null
      throw error
    }
  }

  private isValidPkceVerifier(payload: TokenPayload, codeChallenge: string) {
    const computedChallenge = createHash('sha256').update(payload.code_verifier).digest('base64url')

    return this.safeEqual(computedChallenge, codeChallenge)
  }

  private safeEqual(value: string, expectedValue: string) {
    const valueBuffer = Buffer.from(value)
    const expectedValueBuffer = Buffer.from(expectedValue)

    if (valueBuffer.length !== expectedValueBuffer.length) return false
    return timingSafeEqual(valueBuffer, expectedValueBuffer)
  }

  private disableCaching() {
    this.ctx.response.header('Cache-Control', 'no-store')
    this.ctx.response.header('Pragma', 'no-cache')
  }

  private invalidClientResponse() {
    return this.ctx.response.badRequest({ error: 'invalid_client' })
  }

  private invalidRequestResponse() {
    return this.ctx.response.badRequest({ error: 'invalid_request' })
  }

  private invalidGrantResponse() {
    return this.ctx.response.badRequest({ error: 'invalid_grant' })
  }
}
