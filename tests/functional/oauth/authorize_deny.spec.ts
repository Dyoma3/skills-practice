import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { mcpOAuth } from '#lib/oauth/mcp'
import { createUser } from '#tests/helpers/user'

const claudeRedirectUri = 'https://claude.ai/api/mcp/auth_callback'

function authorizationPayload(overrides: Record<string, unknown> = {}) {
  return {
    response_type: 'code',
    client_id: 'claude',
    redirect_uri: claudeRedirectUri,
    scope: 'mcp:read mcp:write',
    state: 'state-123',
    code_challenge: 'a'.repeat(43),
    code_challenge_method: 'S256',
    resource: mcpOAuth.resource,
    ...overrides,
  }
}

function getRedirectUrl(location: string | undefined) {
  if (!location) throw new Error('Expected Location response header')
  return new URL(location)
}

test.group('POST /oauth/authorize/deny', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('requires authentication', async ({ client }) => {
    const response = await client
      .post('/oauth/authorize/deny')
      .redirects(0)
      .withCsrfToken()
      .form(authorizationPayload())

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('rejects clients outside the static allowlist', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/deny')
      .redirects(0)
      .withGuard('web')
      .loginAs(user)
      .withCsrfToken()
      .form(authorizationPayload({ client_id: 'unknown-client' }))

    response.assertStatus(400)
    response.assertBodyContains({ error: 'invalid_client' })
  })

  test('rejects redirect URIs outside the client allowlist', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/deny')
      .redirects(0)
      .withGuard('web')
      .loginAs(user)
      .withCsrfToken()
      .form(authorizationPayload({ redirect_uri: 'https://attacker.example/oauth/callback' }))

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri',
    })
  })

  test('returns an access_denied redirect and preserves state', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/deny')
      .redirects(0)
      .withGuard('web')
      .loginAs(user)
      .withCsrfToken()
      .form(authorizationPayload())

    response.assertStatus(302)

    const redirectUrl = getRedirectUrl(response.header('location'))

    assert.equal(redirectUrl.origin + redirectUrl.pathname, claudeRedirectUri)
    assert.equal(redirectUrl.searchParams.get('error'), 'access_denied')
    assert.equal(redirectUrl.searchParams.get('state'), 'state-123')
    assert.isNull(redirectUrl.searchParams.get('code'))
  })
})
