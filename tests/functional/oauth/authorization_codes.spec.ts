import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import OAuthAuthorizationCode from '#models/oauth_authorization_code'
import { mcpOAuth } from '#lib/oauth/mcp'
import { oauthServer } from '#lib/oauth/server'
import { UserFactory } from '#database/factories/user_factory'

const codeChallenge = 'challenge'.padEnd(43, 'a')

test.group('OAuth authorization codes', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('issues a hashed, expiring authorization code bound to its grant', async ({ assert }) => {
    const user = await UserFactory.create()
    const { code, authorizationCode } = await OAuthAuthorizationCode.issue({
      userId: user.id,
      clientId: 'codex',
      redirectUri: 'http://127.0.0.1:49152/callback',
      resource: mcpOAuth.resource,
      scopes: ['mcp:read', 'mcp:write'],
      codeChallenge,
      codeChallengeMethod: 'S256',
    })

    assert.match(code, /^[A-Za-z0-9_-]{43}$/)
    assert.notEqual(authorizationCode.codeHash, code)
    assert.match(authorizationCode.codeHash, /^[a-f0-9]{64}$/)
    assert.equal(authorizationCode.userId, user.id)
    assert.equal(authorizationCode.clientId, 'codex')
    assert.equal(authorizationCode.redirectUri, 'http://127.0.0.1:49152/callback')
    assert.equal(authorizationCode.resource, mcpOAuth.resource)
    assert.deepEqual(authorizationCode.scopes, ['mcp:read', 'mcp:write'])
    assert.equal(authorizationCode.codeChallenge, codeChallenge)
    assert.equal(authorizationCode.codeChallengeMethod, 'S256')
    assert.approximately(
      authorizationCode.expiresAt.diff(authorizationCode.createdAt, 'seconds').seconds,
      oauthServer.authorizationCodeTtlSeconds,
      1
    )
  })

  test('atomically consumes an authorization code only once', async ({ assert }) => {
    const user = await UserFactory.create()
    const { code, authorizationCode } = await OAuthAuthorizationCode.issue({
      userId: user.id,
      clientId: 'claude',
      redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      resource: mcpOAuth.resource,
      scopes: ['mcp:read'],
      codeChallenge,
      codeChallengeMethod: 'S256',
    })

    const consumedCodes = await Promise.all([
      OAuthAuthorizationCode.consume(code),
      OAuthAuthorizationCode.consume(code),
    ])

    assert.lengthOf(
      consumedCodes.filter((consumedCode) => consumedCode !== null),
      1
    )
    assert.isNull(await OAuthAuthorizationCode.find(authorizationCode.id))
    assert.isNull(await OAuthAuthorizationCode.consume(code))
  })

  test('rejects and removes expired authorization codes', async ({ assert }) => {
    const user = await UserFactory.create()
    const { code, authorizationCode } = await OAuthAuthorizationCode.issue({
      userId: user.id,
      clientId: 'chatgpt',
      redirectUri: 'https://chatgpt.com/connector_platform_oauth_redirect',
      resource: mcpOAuth.resource,
      scopes: ['mcp:read'],
      codeChallenge,
      codeChallengeMethod: 'S256',
    })

    authorizationCode.expiresAt = DateTime.now().minus({ seconds: 1 })
    await authorizationCode.save()

    assert.isNull(await OAuthAuthorizationCode.consume(code))
    assert.isNull(await OAuthAuthorizationCode.find(authorizationCode.id))
  })

  test('deletes authorization codes when their user is deleted', async ({ assert }) => {
    const user = await UserFactory.create()
    const { authorizationCode } = await OAuthAuthorizationCode.issue({
      userId: user.id,
      clientId: 'codex',
      redirectUri: 'http://localhost:49152/callback',
      resource: mcpOAuth.resource,
      scopes: ['mcp:write'],
      codeChallenge,
      codeChallengeMethod: 'S256',
    })

    await user.delete()

    assert.isNull(await OAuthAuthorizationCode.find(authorizationCode.id))
  })
})
