import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp search_skills', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('searches only skills belonging to the authenticated user', async ({ assert, client }) => {
    const matchingByName = await createSkill(
      user,
      'System design',
      'Design reliable distributed systems'
    )
    const matchingByDescription = await createSkill(
      user,
      'Capacity planning',
      'Estimate distributed system traffic'
    )
    await createSkill(user, 'Database indexing', 'Choose effective database indexes')

    const otherUser = await UserFactory.create()
    await createSkill(otherUser, 'Other system design', 'Must remain isolated')

    const response = await callSearchSkills(client, user, { search: 'SYSTEM' })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.equal(result.total, 2)
    assert.deepEqual(
      result.data.map((skill: { id: string }) => skill.id),
      [matchingByDescription.id, matchingByName.id]
    )
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('paginates search results', async ({ assert, client }) => {
    await createSkill(user, 'Backend design', 'First matching skill')
    await createSkill(user, 'Frontend design', 'Second matching skill')

    const response = await callSearchSkills(client, user, {
      search: 'design',
      page: 1,
      pageSize: 1,
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent
    assert.equal(result.total, 2)
    assert.lengthOf(result.data, 1)
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    await createSkill(user, 'System design', 'Design reliable distributed systems')

    const response = await callSearchSkills(client, user, { search: 'system' }, ['mcp:write'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })
})

function createSkill(owner: User, name: string, description: string) {
  return Skill.create({
    userId: owner.id,
    name,
    description,
  })
}

async function callSearchSkills(
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
        name: 'search_skills',
        arguments: arguments_,
      },
    })
}
