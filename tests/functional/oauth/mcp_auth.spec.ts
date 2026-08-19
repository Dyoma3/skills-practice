import { test } from '@japa/runner'
import router from '@adonisjs/core/services/router'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { mcpOAuth } from '#lib/oauth/mcp'
import { middleware } from '#start/kernel'
import { UserFactory } from '#database/factories/user_factory'

const testRoute = '/__tests/mcp-auth'
const challenge = `Bearer resource_metadata="${mcpOAuth.protectedResourceMetadataUrl}"`

router.get(testRoute, ({ auth }) => ({ userId: auth.user!.id })).use(middleware.mcpAuth())

test.group('MCP authentication middleware', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('returns the protected-resource discovery challenge without a token', async ({
    client,
    assert,
  }) => {
    const response = await client.get(testRoute)

    response.assertStatus(401)
    response.assertBody({ error: 'Unauthorized' })
    assert.equal(response.header('WWW-Authenticate'), challenge)
  })

  test('rejects default API access tokens with the discovery challenge', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const response = await client.get(testRoute).loginAs(user)

    response.assertStatus(401)
    response.assertBody({ error: 'Unauthorized' })
    assert.equal(response.header('WWW-Authenticate'), challenge)
  })

  test('authenticates MCP access tokens through the MCP guard', async ({ client }) => {
    const user = await UserFactory.create()
    const accessToken = await User.mcpAccessTokens.create(user, ['mcp:read'])
    const response = await client.get(testRoute).bearerToken(accessToken.value!.release())

    response.assertStatus(200)
    response.assertBody({ userId: user.id })
  })

  test('rejects expired MCP access tokens with the discovery challenge', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const accessToken = await User.mcpAccessTokens.create(user, ['mcp:read'])

    await db
      .from('auth_access_tokens')
      .where('id', Number(accessToken.identifier))
      .update({ expires_at: new Date(0) })

    const response = await client.get(testRoute).bearerToken(accessToken.value!.release())

    response.assertStatus(401)
    assert.equal(response.header('WWW-Authenticate'), challenge)
  })
})
