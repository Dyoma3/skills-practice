import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Rubric from '#models/rubric'
import Skill from '#models/skill'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp delete_rubric', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('deletes an unreferenced rubric from the shared catalog', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()

    const response = await callDeleteRubric(client, user, rubric.id)

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepEqual(result, { id: rubric.id })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
    assert.isNull(await Rubric.find(rubric.id))
  })

  test('rejects a rubric referenced by a question', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()
    const otherUser = await UserFactory.create()
    const skill = await Skill.create({
      userId: otherUser.id,
      name: 'Other user skill',
      description: 'Other user skill description',
    })
    const question = await QuestionFactory.merge({
      skillId: skill.id,
      rubricId: rubric.id,
    }).create()

    const response = await callDeleteRubric(client, user, rubric.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Cannot delete a rubric referenced by questions')
    assert.isNotNull(await Rubric.find(rubric.id))
    assert.isNotNull(await question.refresh())
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()

    const response = await callDeleteRubric(client, user, rubric.id, ['mcp:read'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNotNull(await Rubric.find(rubric.id))
  })
})

async function callDeleteRubric(
  client: ApiClient,
  authenticatedUser: User,
  rubricId: string,
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
        name: 'delete_rubric',
        arguments: { rubricId },
      },
    })
}
