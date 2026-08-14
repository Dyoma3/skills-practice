import { createHash } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import OAuthAuthorizationCode from '#models/oauth_authorization_code'
import { mcpOAuth } from '#lib/oauth/mcp'
import { createUser } from '#tests/helpers/user'

const codeVerifier = 'a'.repeat(43)
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
const claudeRedirectUri = 'https://claude.ai/api/mcp/auth_callback'

function authorizationPayload(overrides: Record<string, unknown> = {}) {
  return {
    response_type: 'code',
    client_id: 'claude',
    redirect_uri: claudeRedirectUri,
    scope: 'mcp:read mcp:write',
    state: 'state-123',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    resource: mcpOAuth.resource,
    ...overrides,
  }
}

function getRedirectUrl(redirectTo: string | undefined) {
  if (!redirectTo) throw new Error('Expected redirect_to response field')
  return new URL(redirectTo)
}

test.group('POST /oauth/authorize/approve', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('requires authentication', async ({ client }) => {
    const response = await client.post('/oauth/authorize/approve').json(authorizationPayload())

    response.assertStatus(401)
  })

  test('rejects clients outside the static allowlist', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ client_id: 'unknown-client' }))

    response.assertStatus(400)
    response.assertBodyContains({ error: 'invalid_client' })
  })

  test('rejects unsupported OAuth resources', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ resource: 'https://api.example.com/other-resource' }))

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'invalid_target',
      error_description: 'Unsupported OAuth resource',
    })
  })

  test('rejects redirect URIs outside the client allowlist', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ redirect_uri: 'https://attacker.example/oauth/callback' }))

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri',
    })
  })

  test('rejects malformed S256 code challenges without issuing a code', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ code_challenge: 'too-short' }))

    response.assertStatus(422)
    assert.isNull(await OAuthAuthorizationCode.query().where('userId', user.id).first())
  })

  test('returns and persists an authorization code for an allowed request', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload())

    response.assertStatus(200)

    const redirectUrl = getRedirectUrl(response.body().redirect_to)
    const code = redirectUrl.searchParams.get('code')

    assert.equal(redirectUrl.origin + redirectUrl.pathname, claudeRedirectUri)
    assert.equal(redirectUrl.searchParams.get('state'), 'state-123')
    assert.match(code!, /^[A-Za-z0-9_-]{43}$/)

    const authorizationCode = await OAuthAuthorizationCode.query().where('userId', user.id).first()

    assert.isNotNull(authorizationCode)
    assert.notEqual(authorizationCode!.codeHash, code)
    assert.equal(authorizationCode!.clientId, 'claude')
    assert.equal(authorizationCode!.redirectUri, claudeRedirectUri)
    assert.equal(authorizationCode!.resource, mcpOAuth.resource)
    assert.deepEqual(authorizationCode!.scopes, ['mcp:read', 'mcp:write'])
    assert.equal(authorizationCode!.codeChallenge, codeChallenge)
    assert.equal(authorizationCode!.codeChallengeMethod, 'S256')
  })

  test('allows native-client loopback redirects with dynamic ports and subpaths', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const redirectUri = 'http://127.0.0.1:59137/callback/--52FXdsbEbv'
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ client_id: 'codex', redirect_uri: redirectUri }))

    response.assertStatus(200)

    const redirectUrl = getRedirectUrl(response.body().redirect_to)

    assert.equal(redirectUrl.origin + redirectUrl.pathname, redirectUri)
    assert.isString(redirectUrl.searchParams.get('code'))
  })

  test('allows ChatGPT connector redirects with generated connector ids', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const redirectUri = 'https://chatgpt.com/connector/oauth/Caw9Tvne-u1F'
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ client_id: 'chatgpt', redirect_uri: redirectUri }))

    response.assertStatus(200)

    const redirectUrl = getRedirectUrl(response.body().redirect_to)

    assert.equal(redirectUrl.origin + redirectUrl.pathname, redirectUri)
    assert.isString(redirectUrl.searchParams.get('code'))
  })

  test('redirects allowed clients with invalid_scope without issuing a code', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const response = await client
      .post('/oauth/authorize/approve')
      .loginAs(user)
      .json(authorizationPayload({ scope: 'mcp:admin' }))

    response.assertStatus(200)

    const redirectUrl = getRedirectUrl(response.body().redirect_to)

    assert.equal(redirectUrl.searchParams.get('error'), 'invalid_scope')
    assert.equal(redirectUrl.searchParams.get('state'), 'state-123')
    assert.isNull(redirectUrl.searchParams.get('code'))
    assert.isNull(await OAuthAuthorizationCode.query().where('userId', user.id).first())
  })

  test('uses the client defaults when scope is omitted', async ({ client, assert }) => {
    const user = await createUser()
    const payload = { ...authorizationPayload(), scope: undefined }

    const response = await client.post('/oauth/authorize/approve').loginAs(user).json(payload)

    response.assertStatus(200)

    const authorizationCode = await OAuthAuthorizationCode.query().where('userId', user.id).first()

    assert.deepEqual(authorizationCode!.scopes, ['mcp:read', 'mcp:write'])
  })
})
