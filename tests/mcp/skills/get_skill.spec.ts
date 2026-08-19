import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User
let skill: Skill

test.group('POST /mcp get_skill', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    skill = await Skill.create({
      userId: user.id,
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    return rollback
  })

  test('gets a skill belonging to the authenticated user', async ({ assert, client }) => {
    const response = await callGetSkill(client, user, { skillId: skill.id })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      id: skill.id,
      userId: user.id,
      parentId: null,
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    assert.notProperty(result, 'children')
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('optionally includes the skill immediate children', async ({ assert, client }) => {
    const child = await Skill.create({
      userId: user.id,
      parentId: skill.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    })
    await Skill.create({
      userId: user.id,
      parentId: child.id,
      name: 'Request estimation',
      description: 'Estimate request volume',
    })

    const response = await callGetSkill(client, user, {
      skillId: skill.id,
      includeChildren: true,
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent

    assert.lengthOf(result.children, 1)
    assert.deepInclude(result.children[0], {
      id: child.id,
      userId: user.id,
      parentId: skill.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    })
    assert.notProperty(result.children[0], 'children')
  })

  test('rejects skills belonging to another user', async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherSkill = await Skill.create({
      userId: otherUser.id,
      name: 'Database design',
      description: 'Design relational databases',
    })

    const response = await callGetSkill(client, user, { skillId: otherSkill.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const response = await callGetSkill(client, user, { skillId: skill.id }, [])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })
})

async function callGetSkill(
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
        name: 'get_skill',
        arguments: arguments_,
      },
    })
}
