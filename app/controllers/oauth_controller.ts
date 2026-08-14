import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import OauthApproveAuthorizationService from '#services/oauth/approve_authorization'
import OauthDenyAuthorizationService from '#services/oauth/deny_authorization'
import OauthTokenService from '#services/oauth/token'
import { mcpOAuth } from '#lib/oauth/mcp'
import { oauthServer } from '#lib/oauth/server'

export default class OauthController {
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
}
