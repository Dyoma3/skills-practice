import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import OAuthRedirectUriMatcher from '#lib/oauth/redirect_uri'
import { getOAuthResource } from '#lib/oauth/resources'
import type { OAuthResourceConfig } from '#lib/oauth/types'
import validateRequest from '#lib/request_validator'
import { approveAuthorizationValidator } from '#validators/oauth'

type DenyAuthorizationPayload = z.infer<typeof approveAuthorizationValidator>

@inject()
export default class OauthDenyAuthorizationService {
  constructor(protected ctx: HttpContext) {}

  execute() {
    const payload = validateRequest(approveAuthorizationValidator, this.ctx.request.body())
    const authorizationResource = this.getAuthorizationResource(payload)

    if (!authorizationResource) return this.invalidTargetResponse()

    const client = this.getClient(authorizationResource, payload)

    if (!client) return this.invalidClientResponse()
    if (!new OAuthRedirectUriMatcher(client, payload.redirect_uri).execute()) {
      return this.invalidRedirectUriResponse()
    }

    return this.redirectWithAccessDenied(payload)
  }

  private getAuthorizationResource(payload: DenyAuthorizationPayload) {
    return getOAuthResource(payload.resource)
  }

  private getClient(authorizationResource: OAuthResourceConfig, payload: DenyAuthorizationPayload) {
    return authorizationResource.clients.find((candidate) => candidate.id === payload.client_id)
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

  private redirectWithAccessDenied(payload: DenyAuthorizationPayload) {
    return this.ctx.response.ok({
      redirect_to: this.buildRedirectUrl(payload.redirect_uri, {
        error: 'access_denied',
        state: payload.state,
      }),
    })
  }
}
