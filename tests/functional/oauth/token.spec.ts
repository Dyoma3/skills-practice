import { createHash } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import OAuthAuthorizationCode from '#models/oauth_authorization_code'
import User from '#models/user'
import { mcpOAuth } from '#lib/oauth/mcp'
import { oauthServer } from '#lib/oauth/server'
import { AuthTokenTypes } from '#types/index'
import { createUser } from '#tests/helpers/user'

const codeVerifier = 'a'.repeat(43)
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
const claudeRedirectUri = 'https://claude.ai/api/mcp/auth_callback'

type AuthorizationCodeOverrides = {
  clientId?: string
  redirectUri?: string
  resource?: string
  scopes?: string[]
  codeChallenge?: string
}

async function issueAuthorizationCode(userId: number, overrides: AuthorizationCodeOverrides = {}) {
  return await OAuthAuthorizationCode.issue({
    userId,
    clientId: overrides.clientId ?? 'claude',
    redirectUri: overrides.redirectUri ?? claudeRedirectUri,
    resource: overrides.resource ?? mcpOAuth.resource,
    scopes: overrides.scopes ?? ['mcp:read'],
    codeChallenge: overrides.codeChallenge ?? codeChallenge,
    codeChallengeMethod: 'S256',
  })
}

function tokenPayload(code: string, overrides: Record<string, unknown> = {}) {
  return {
    grant_type: 'authorization_code',
    code,
    client_id: 'claude',
    redirect_uri: claudeRedirectUri,
    code_verifier: codeVerifier,
    resource: mcpOAuth.resource,
    ...overrides,
  }
}

test.group('POST /oauth/token', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('returns invalid_request for malformed exchanges and requires resource', async ({
    client,
  }) => {
    const response = await client.post('/oauth/token').form({
      grant_type: 'authorization_code',
      code: 'code',
      client_id: 'claude',
      redirect_uri: claudeRedirectUri,
      code_verifier: codeVerifier,
    })

    response.assertStatus(400)
    response.assertBodyContains({ error: 'invalid_request' })
    response.assertHeader('Cache-Control', 'no-store')
    response.assertHeader('Pragma', 'no-cache')
  })

  test('exchanges a code for an isolated MCP bearer token exactly once', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const { code, authorizationCode } = await issueAuthorizationCode(user.id, {
      scopes: ['mcp:read', 'mcp:write'],
    })
    const response = await client.post('/oauth/token').form(tokenPayload(code))

    response.assertStatus(200)
    response.assertBodyContains({
      token_type: 'Bearer',
      expires_in: oauthServer.accessTokenTtlSeconds,
      scope: 'mcp:read mcp:write',
    })
    response.assertHeader('Cache-Control', 'no-store')
    response.assertHeader('Pragma', 'no-cache')

    const accessToken = response.body().access_token

    assert.isString(accessToken)
    assert.isNull(await OAuthAuthorizationCode.find(authorizationCode.id))

    const mcpTokens = await User.mcpAccessTokens.all(user)

    assert.lengthOf(mcpTokens, 1)
    assert.equal(mcpTokens[0].type, AuthTokenTypes.Mcp)
    assert.equal(mcpTokens[0].name, 'oauth:claude')
    assert.deepEqual(mcpTokens[0].abilities, ['mcp:read', 'mcp:write'])
    assert.approximately(
      (mcpTokens[0].expiresAt!.getTime() - mcpTokens[0].createdAt.getTime()) / 1000,
      oauthServer.accessTokenTtlSeconds,
      1
    )
    assert.lengthOf(await User.accessTokens.all(user), 0)

    const apiResponse = await client.get('/api/v1/account/profile').bearerToken(accessToken)
    apiResponse.assertStatus(401)

    const reuseResponse = await client.post('/oauth/token').form(tokenPayload(code))
    reuseResponse.assertStatus(400)
    reuseResponse.assertBodyContains({ error: 'invalid_grant' })
  })

  test('rejects and consumes a code when the PKCE verifier does not match', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const { code, authorizationCode } = await issueAuthorizationCode(user.id)
    const response = await client
      .post('/oauth/token')
      .form(tokenPayload(code, { code_verifier: 'b'.repeat(43) }))

    response.assertStatus(400)
    response.assertBodyContains({ error: 'invalid_grant' })
    assert.isNull(await OAuthAuthorizationCode.find(authorizationCode.id))
    assert.lengthOf(await User.mcpAccessTokens.all(user), 0)
  })

  test('rejects malformed PKCE verifiers before consuming the code', async ({ client, assert }) => {
    const user = await createUser()
    const { code, authorizationCode } = await issueAuthorizationCode(user.id)
    const response = await client
      .post('/oauth/token')
      .form(tokenPayload(code, { code_verifier: 'too-short' }))

    response.assertStatus(400)
    response.assertBodyContains({ error: 'invalid_request' })
    assert.isNotNull(await OAuthAuthorizationCode.find(authorizationCode.id))
    assert.lengthOf(await User.mcpAccessTokens.all(user), 0)
  })

  test('rejects redirect URI and resource mismatches', async ({ client }) => {
    const user = await createUser()
    const redirectCode = await issueAuthorizationCode(user.id)
    const redirectResponse = await client.post('/oauth/token').form(
      tokenPayload(redirectCode.code, {
        redirect_uri: 'https://claude.ai/api/mcp/other_callback',
      })
    )

    redirectResponse.assertStatus(400)
    redirectResponse.assertBodyContains({ error: 'invalid_grant' })

    const resourceCode = await issueAuthorizationCode(user.id)
    const resourceResponse = await client.post('/oauth/token').form(
      tokenPayload(resourceCode.code, {
        resource: 'https://api.example.com/other-resource',
      })
    )

    resourceResponse.assertStatus(400)
    resourceResponse.assertBodyContains({ error: 'invalid_grant' })
  })

  test('exchanges a code returned by authorization approval', async ({ client, assert }) => {
    const user = await createUser()
    const approvalResponse = await client.post('/oauth/authorize/approve').loginAs(user).json({
      response_type: 'code',
      client_id: 'claude',
      redirect_uri: claudeRedirectUri,
      scope: 'mcp:read mcp:write',
      state: 'state-123',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      resource: mcpOAuth.resource,
    })

    approvalResponse.assertStatus(200)

    const redirectUrl = new URL(approvalResponse.body().redirect_to)
    const code = redirectUrl.searchParams.get('code')

    assert.isString(code)

    const tokenResponse = await client.post('/oauth/token').form(tokenPayload(code!))

    tokenResponse.assertStatus(200)
    tokenResponse.assertBodyContains({
      token_type: 'Bearer',
      expires_in: oauthServer.accessTokenTtlSeconds,
      scope: 'mcp:read mcp:write',
    })
    assert.isString(tokenResponse.body().access_token)
  })
})
