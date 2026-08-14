import { test } from '@japa/runner'
import { oauthServer } from '#lib/oauth/server'

test.group('GET /.well-known/oauth-authorization-server', () => {
  test('returns OAuth authorization server metadata', async ({ client }) => {
    const response = await client.get('/.well-known/oauth-authorization-server')

    response.assertStatus(200)
    response.assertBody({
      issuer: oauthServer.issuer,
      authorization_endpoint: oauthServer.authorizationEndpoint,
      token_endpoint: oauthServer.tokenEndpoint,
      token_endpoint_auth_methods_supported: ['none'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['mcp:read', 'mcp:write'],
    })
  })
})
