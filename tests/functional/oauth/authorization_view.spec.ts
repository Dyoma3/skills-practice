import { createHash } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { mcpOAuth } from '#lib/oauth/mcp'
import { UserFactory } from '#database/factories/user_factory'

const codeChallenge = createHash('sha256').update('a'.repeat(43)).digest('base64url')

function authorizationQuery(overrides: Record<string, string> = {}) {
  return {
    response_type: 'code',
    client_id: 'claude',
    redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
    scope: 'mcp:read mcp:write',
    state: 'state-123',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    resource: mcpOAuth.resource,
    ...overrides,
  }
}

test.group('GET /oauth/authorize', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('redirects guests to the login page', async ({ client, assert }) => {
    const response = await client.get('/oauth/authorize').redirects(0).qs(authorizationQuery())

    response.assertStatus(302)

    const loginUrl = new URL(response.header('location')!, 'http://localhost')

    assert.equal(loginUrl.pathname, '/login')
    assert.equal(loginUrl.searchParams.get('client_id'), 'claude')
    assert.equal(loginUrl.searchParams.get('state'), 'state-123')
  })

  test('renders the consent request for a web session', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .get('/oauth/authorize')
      .withGuard('web')
      .loginAs(user)
      .qs(authorizationQuery())

    response.assertStatus(200)
    response.assertHeader('content-type', 'text/html; charset=utf-8')
    response.assertTextIncludes('Authorize access')
    response.assertTextIncludes('claude')
    response.assertTextIncludes(mcpOAuth.resource)
    response.assertTextIncludes('mcp:read')
    response.assertTextIncludes('mcp:write')
    response.assertTextIncludes('/oauth/authorize/approve')
    response.assertTextIncludes('/oauth/authorize/deny')
    response.assertTextIncludes("name='_csrf'")
    response.assertTextIncludes(`value="${codeChallenge}"`)
  })

  test('uses the client scopes when the request omits scope', async ({ client }) => {
    const user = await UserFactory.create()
    const query = Object.fromEntries(
      Object.entries(authorizationQuery()).filter(([name]) => name !== 'scope')
    )
    const response = await client.get('/oauth/authorize').withGuard('web').loginAs(user).qs(query)

    response.assertStatus(200)
    response.assertTextIncludes('mcp:read')
    response.assertTextIncludes('mcp:write')
  })

  test('does not render decision forms for an invalid request', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const response = await client
      .get('/oauth/authorize')
      .withGuard('web')
      .loginAs(user)
      .qs(authorizationQuery({ code_challenge_method: 'plain' }))

    response.assertStatus(200)
    response.assertTextIncludes('invalid parameters: code_challenge_method')
    assert.notInclude(response.text(), '/oauth/authorize/approve')
    assert.notInclude(response.text(), '/oauth/authorize/deny')
  })

  test('does not render decision forms for an unknown client', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const response = await client
      .get('/oauth/authorize')
      .withGuard('web')
      .loginAs(user)
      .qs(authorizationQuery({ client_id: 'unknown-client' }))

    response.assertStatus(200)
    response.assertTextIncludes('The OAuth client is not recognized.')
    assert.notInclude(response.text(), '/oauth/authorize/approve')
    assert.notInclude(response.text(), '/oauth/authorize/deny')
  })
})
