import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import OAuthAuthorizationCode from '#models/oauth_authorization_code'
import OAuthRedirectUriMatcher from '#lib/oauth/redirect_uri'
import { getOAuthResource } from '#lib/oauth/resources'
import type { OAuthClientConfig, OAuthResourceConfig } from '#lib/oauth/types'
import validateRequest from '#lib/request_validator'
import { approveAuthorizationValidator } from '#validators/oauth'

type ApproveAuthorizationPayload = z.infer<typeof approveAuthorizationValidator>

@inject()
export default class OauthApproveAuthorizationService {
  constructor(protected ctx: HttpContext) {}

  async execute() {
    const payload = validateRequest(approveAuthorizationValidator, this.ctx.request.body())
    const authorizationResource = this.getAuthorizationResource(payload)

    if (!authorizationResource) return this.invalidTargetResponse()

    const client = this.getClient(authorizationResource, payload)

    if (!client) return this.invalidClientResponse()
    if (!new OAuthRedirectUriMatcher(client, payload.redirect_uri).execute()) {
      return this.invalidRedirectUriResponse()
    }

    const scopes = this.parseScopes(payload.scope, client.allowedScopes)

    if (!this.clientAllowsScopes(client, scopes)) return this.redirectWithInvalidScope(payload)

    const code = await this.issueAuthorizationCode(client, scopes, payload)
    return this.redirectWithAuthorizationCode(payload, code)
  }

  private getAuthorizationResource(payload: ApproveAuthorizationPayload) {
    return getOAuthResource(payload.resource)
  }

  private getClient(
    authorizationResource: OAuthResourceConfig,
    payload: ApproveAuthorizationPayload
  ) {
    return authorizationResource.clients.find((candidate) => candidate.id === payload.client_id)
  }

  private clientAllowsScopes(client: OAuthClientConfig, scopes: string[]) {
    const allowedScopes = new Set<string>(client.allowedScopes)
    return scopes.every((scope) => allowedScopes.has(scope))
  }

  private parseScopes(scope: string | undefined, defaultScopes: readonly string[]) {
    const rawScopes = scope?.trim() ? scope.split(' ') : defaultScopes
    return [...new Set(rawScopes.map((value) => value.trim()).filter(Boolean))]
  }

  private buildRedirectUrl(redirectUri: string, params: Record<string, string | undefined>) {
    const redirectUrl = new URL(redirectUri)

    Object.entries(params).forEach(([key, value]) => {
      if (value) redirectUrl.searchParams.set(key, value)
    })

    return redirectUrl.toString()
  }

  private invalidTargetResponse() {
    return this.ctx.response.badRequest({
      error: 'invalid_target',
      error_description: 'Unsupported OAuth resource',
    })
  }

  private invalidClientResponse() {
    return this.ctx.response.badRequest({ error: 'invalid_client' })
  }

  private invalidRedirectUriResponse() {
    return this.ctx.response.badRequest({
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri',
    })
  }

  private redirectWithInvalidScope(payload: ApproveAuthorizationPayload) {
    return this.ctx.response.redirect(
      this.buildRedirectUrl(payload.redirect_uri, {
        error: 'invalid_scope',
        state: payload.state,
      })
    )
  }

  private redirectWithAuthorizationCode(payload: ApproveAuthorizationPayload, code: string) {
    return this.ctx.response.redirect(
      this.buildRedirectUrl(payload.redirect_uri, {
        code,
        state: payload.state,
      })
    )
  }

  private async issueAuthorizationCode(
    client: OAuthClientConfig,
    scopes: string[],
    payload: ApproveAuthorizationPayload
  ) {
    const { code } = await OAuthAuthorizationCode.issue({
      userId: this.ctx.auth.user!.id,
      clientId: client.id,
      redirectUri: payload.redirect_uri,
      resource: payload.resource,
      scopes,
      codeChallenge: payload.code_challenge,
      codeChallengeMethod: payload.code_challenge_method,
    })

    return code
  }
}
