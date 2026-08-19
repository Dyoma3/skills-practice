import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { RubricFactory } from '#database/factories/rubric_factory'
import { QuestionFactory } from '#database/factories/question_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp create_skill', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('creates a root skill for the authenticated user', async ({ assert, client }) => {
    const response = await callCreateSkill(client, user, {
      name: 'System design',
      description: 'Design reliable distributed systems',
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      userId: user.id,
      parentId: null,
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    const storedSkill = await Skill.findOrFail(result.id)
    assert.equal(storedSkill.userId, user.id)
    assert.isNull(storedSkill.parentId)
  })

  test('creates a child under a skill belonging to the authenticated user', async ({
    assert,
    client,
  }) => {
    const parent = await createSkill(user, 'System design')

    const response = await callCreateSkill(client, user, {
      parentId: parent.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent
    assert.equal(result.userId, user.id)
    assert.equal(result.parentId, parent.id)
  })

  test('rejects a parent skill belonging to another user', async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherSkill = await createSkill(otherUser, 'Other user skill')

    const response = await callCreateSkill(client, user, {
      parentId: otherSkill.id,
      name: 'Unauthorized child',
      description: 'Must not be created',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Skill.query().where('name', 'Unauthorized child').first())
  })

  test('rejects adding a child to a skill that already has questions', async ({
    assert,
    client,
  }) => {
    const parent = await createSkill(user, 'Practiced skill')
    const rubric = await RubricFactory.create()
    await QuestionFactory.merge({ skillId: parent.id, rubricId: rubric.id }).create()

    const response = await callCreateSkill(client, user, {
      parentId: parent.id,
      name: 'Invalid child',
      description: 'Would turn the practiced skill into a branch',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(
      mcpError.content[0].text,
      'Cannot add a child to a skill that already has questions'
    )
    assert.isNull(await Skill.query().where('name', 'Invalid child').first())
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const response = await callCreateSkill(
      client,
      user,
      {
        name: 'Read only skill',
        description: 'Must not be created',
      },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Skill.query().where('name', 'Read only skill').first())
  })
})

function createSkill(owner: User, name: string) {
  return Skill.create({
    userId: owner.id,
    name,
    description: `${name} description`,
  })
}

async function callCreateSkill(
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
        name: 'create_skill',
        arguments: arguments_,
      },
    })
}
