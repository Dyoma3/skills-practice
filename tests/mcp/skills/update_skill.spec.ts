import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp update_skill', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('updates an owned skill name and description', async ({ assert, client }) => {
    const parent = await createSkill(user, 'Parent skill')
    const skill = await createSkill(user, 'Original skill', parent.id)

    const response = await callUpdateSkill(client, user, {
      skillId: skill.id,
      name: 'Updated skill',
      description: 'Updated skill description',
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      id: skill.id,
      userId: user.id,
      parentId: parent.id,
      name: 'Updated skill',
      description: 'Updated skill description',
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    await skill.refresh()
    assert.equal(skill.name, 'Updated skill')
    assert.equal(skill.description, 'Updated skill description')
    assert.equal(skill.parentId, parent.id)
  })

  test('requires at least one field to update', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Unchanged skill')

    const response = await callUpdateSkill(client, user, { skillId: skill.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.include(mcpError.content[0].text, 'At least one field must be provided')
  })

  test("rejects another user's skill", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const skill = await createSkill(otherUser, 'Other user skill')

    const response = await callUpdateSkill(client, user, {
      skillId: skill.id,
      name: 'Unauthorized name',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')

    await skill.refresh()
    assert.equal(skill.name, 'Other user skill')
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Read only skill')

    const response = await callUpdateSkill(
      client,
      user,
      { skillId: skill.id, name: 'Unauthorized name' },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')

    await skill.refresh()
    assert.equal(skill.name, 'Read only skill')
  })
})

function createSkill(owner: User, name: string, parentId: string | null = null) {
  return Skill.create({
    userId: owner.id,
    parentId,
    name,
    description: `${name} description`,
  })
}

async function callUpdateSkill(
  client: ApiClient,
  authenticatedUser: User,
  arguments_: Record<string, unknown>,
  abilities?: string[]
) {
  return client
    .post('/mcp')
    .headers(await getMcpHeaders(authenticatedUser, abilities))
    .json({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'update_skill',
        arguments: arguments_,
      },
    })
}
