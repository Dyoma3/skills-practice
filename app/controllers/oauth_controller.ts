import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import OauthApproveAuthorizationService from '#services/oauth/approve_authorization'
import OauthDenyAuthorizationService from '#services/oauth/deny_authorization'
import OauthTokenService from '#services/oauth/token'
import { mcpOAuth } from '#lib/oauth/mcp'
import { oauthServer } from '#lib/oauth/server'
import { getOAuthResource } from '#lib/oauth/resources'
import OAuthRedirectUriMatcher from '#lib/oauth/redirect_uri'
import { approveAuthorizationValidator } from '#validators/oauth'

const authorizationParamNames = [
  'response_type',
  'client_id',
  'redirect_uri',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
  'resource',
] as const

const requiredAuthorizationParamNames = [
  'response_type',
  'client_id',
  'redirect_uri',
  'code_challenge',
  'code_challenge_method',
  'resource',
] as const

type AuthorizationParamName = (typeof authorizationParamNames)[number]
type AuthorizationParams = Partial<Record<AuthorizationParamName, string>>

export default class OauthController {
  showAuthorization({ request, view }: HttpContext) {
    const params = this.readAuthorizationParams(request.qs())
    const missingParams = requiredAuthorizationParamNames.filter((name) => !params[name])
    const validation = approveAuthorizationValidator.safeParse(params)
    let error: string | null = null
    let requestedScopes: string[] = []
    let authorizationFields: { name: string; value: string }[] = []

    if (missingParams.length) {
      error = `The authorization request is missing: ${missingParams.join(', ')}`
    } else if (!validation.success) {
      const invalidParams = [
        ...new Set(
          validation.error.issues
            .map((issue) => issue.path[0])
            .filter((name): name is string => typeof name === 'string')
        ),
      ]

      error = `The authorization request has invalid parameters: ${invalidParams.join(', ')}`
    } else {
      const authorizationResource = getOAuthResource(validation.data.resource)
      const client = authorizationResource?.clients.find(
        (candidate) => candidate.id === validation.data.client_id
      )

      if (!authorizationResource) {
        error = 'The requested OAuth resource is not supported.'
      } else if (!client) {
        error = 'The OAuth client is not recognized.'
      } else if (!new OAuthRedirectUriMatcher(client, validation.data.redirect_uri).execute()) {
        error = 'The OAuth redirect URI is not allowed.'
      } else {
        requestedScopes = this.parseScopes(validation.data.scope, client.allowedScopes)
        authorizationFields = Object.entries(validation.data).flatMap(([name, value]) =>
          value === undefined ? [] : [{ name, value }]
        )
      }
    }

    return view.render('oauth/authorize', {
      error,
      clientId: params.client_id ?? '',
      resource: params.resource ?? '',
      requestedScopes,
      authorizationFields,
    })
  }

  @inject()
  approveAuthorization(_ctx: HttpContext, authorization: OauthApproveAuthorizationService) {
    return authorization.execute()
  }

  @inject()
  denyAuthorization(_ctx: HttpContext, authorization: OauthDenyAuthorizationService) {
    return authorization.execute()
  }

  @inject()
  token(_ctx: HttpContext, token: OauthTokenService) {
    return token.execute()
  }

  getMcpProtectedResource({ response }: HttpContext) {
    return response.ok({
      resource: mcpOAuth.resource,
      authorization_servers: [oauthServer.issuer],
      scopes_supported: mcpOAuth.scopes,
      bearer_methods_supported: ['header'],
      resource_name: 'Skills Practice MCP',
    })
  }

  getAuthorizationServer({ response }: HttpContext) {
    return response.ok({
      issuer: oauthServer.issuer,
      authorization_endpoint: oauthServer.authorizationEndpoint,
      token_endpoint: oauthServer.tokenEndpoint,
      token_endpoint_auth_methods_supported: oauthServer.tokenEndpointAuthMethods,
      response_types_supported: oauthServer.responseTypes,
      grant_types_supported: oauthServer.grantTypes,
      code_challenge_methods_supported: oauthServer.codeChallengeMethods,
      scopes_supported: oauthServer.scopes,
    })
  }

  private readAuthorizationParams(query: Record<string, unknown>) {
    return authorizationParamNames.reduce<AuthorizationParams>((params, name) => {
      const value = query[name]
      if (typeof value === 'string') params[name] = value
      return params
    }, {})
  }

  private parseScopes(scope: string | undefined, defaultScopes: readonly string[]) {
    const rawScopes = scope?.trim() ? scope.split(' ') : defaultScopes
    return [...new Set(rawScopes.map((value) => value.trim()).filter(Boolean))]
  }
}
