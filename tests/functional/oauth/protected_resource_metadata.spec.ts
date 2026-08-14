import { test } from '@japa/runner'
import { mcpOAuth } from '#lib/oauth/mcp'
import { oauthServer } from '#lib/oauth/server'

test.group('GET /.well-known/oauth-protected-resource/mcp', () => {
  test('links the MCP resource to its authorization server metadata', async ({
    client,
    assert,
  }) => {
    const protectedResourceResponse = await client.get('/.well-known/oauth-protected-resource/mcp')

    protectedResourceResponse.assertStatus(200)
    protectedResourceResponse.assertBody({
      resource: mcpOAuth.resource,
      authorization_servers: [oauthServer.issuer],
      scopes_supported: ['mcp:read', 'mcp:write'],
      bearer_methods_supported: ['header'],
      resource_name: 'Skills Practice MCP',
    })

    const [authorizationServer] = protectedResourceResponse.body().authorization_servers

    assert.equal(authorizationServer, oauthServer.issuer)

    const authorizationServerResponse = await client.get('/.well-known/oauth-authorization-server')

    authorizationServerResponse.assertStatus(200)
    authorizationServerResponse.assertBodyContains({
      issuer: authorizationServer,
      authorization_endpoint: oauthServer.authorizationEndpoint,
      token_endpoint: oauthServer.tokenEndpoint,
    })
  })
})
