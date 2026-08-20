import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp delete_skill', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('deletes an empty skill belonging to the authenticated user', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Obsolete skill')

    const response = await callDeleteSkill(client, user, skill.id)

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepEqual(result, { id: skill.id })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
    assert.isNull(await Skill.find(skill.id))
  })

  test('rejects a skill with children', async ({ assert, client }) => {
    const parent = await createSkill(user, 'Parent skill')
    const child = await createSkill(user, 'Child skill', parent.id)

    const response = await callDeleteSkill(client, user, parent.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Cannot delete a skill with children')
    assert.isNotNull(await Skill.find(parent.id))
    assert.isNotNull(await Skill.find(child.id))
  })

  test('rejects a skill with questions', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Practiced skill')
    const rubric = await RubricFactory.create()
    await QuestionFactory.merge({ skillId: skill.id, rubricId: rubric.id }).create()

    const response = await callDeleteSkill(client, user, skill.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Cannot delete a skill with questions')
    assert.isNotNull(await Skill.find(skill.id))
  })

  test("rejects another user's skill", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const skill = await createSkill(otherUser, 'Other user skill')

    const response = await callDeleteSkill(client, user, skill.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNotNull(await Skill.find(skill.id))
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Read only skill')

    const response = await callDeleteSkill(client, user, skill.id, ['mcp:read'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNotNull(await Skill.find(skill.id))
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

async function callDeleteSkill(
  client: ApiClient,
  authenticatedUser: User,
  skillId: string,
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
        name: 'delete_skill',
        arguments: { skillId },
      },
    })
}
