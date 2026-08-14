import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { AuthTokenTypes } from '#types/index'
import { createUser } from '#tests/helpers/user'

test.group('OAuth access token providers', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('stores MCP tokens separately with their granted abilities', async ({ assert }) => {
    const user = await createUser()

    await User.accessTokens.create(user)
    await User.mcpAccessTokens.create(user, ['mcp:read'])

    const apiTokens = await User.accessTokens.all(user)
    const mcpTokens = await User.mcpAccessTokens.all(user)

    assert.lengthOf(apiTokens, 1)
    assert.lengthOf(mcpTokens, 1)
    assert.equal(mcpTokens[0].type, AuthTokenTypes.Mcp)
    assert.deepEqual(mcpTokens[0].abilities, ['mcp:read'])
  })

  test('does not verify tokens issued by the other provider', async ({ assert }) => {
    const user = await createUser()
    const apiToken = await User.accessTokens.create(user)
    const mcpToken = await User.mcpAccessTokens.create(user, ['mcp:read', 'mcp:write'])

    assert.isNotNull(await User.accessTokens.verify(apiToken.value!))
    assert.isNull(await User.mcpAccessTokens.verify(apiToken.value!))
    assert.isNotNull(await User.mcpAccessTokens.verify(mcpToken.value!))
    assert.isNull(await User.accessTokens.verify(mcpToken.value!))
  })
})
