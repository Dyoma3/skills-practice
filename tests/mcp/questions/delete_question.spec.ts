import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Question from '#models/question'
import Skill from '#models/skill'
import { AttemptFactory } from '#database/factories/attempt_factory'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp delete_question', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('deletes an unused question belonging to the authenticated user', async ({
    assert,
    client,
  }) => {
    const question = await createQuestion(user, 'Obsolete question')

    const response = await callDeleteQuestion(client, user, question.id)

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepEqual(result, { id: question.id })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
    assert.isNull(await Question.find(question.id))
  })

  test('rejects a question with attempts', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Practiced question')
    const attempt = await AttemptFactory.merge({ questionId: question.id }).create()

    const response = await callDeleteQuestion(client, user, question.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Cannot delete a question with attempts')
    assert.isNotNull(await Question.find(question.id))
    assert.isNotNull(await attempt.refresh())
  })

  test("rejects another user's question", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const question = await createQuestion(otherUser, 'Other user question')

    const response = await callDeleteQuestion(client, user, question.id)

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNotNull(await Question.find(question.id))
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Read only question')

    const response = await callDeleteQuestion(client, user, question.id, ['mcp:read'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNotNull(await Question.find(question.id))
  })
})

async function createQuestion(owner: User, skillName: string) {
  const skill = await Skill.create({
    userId: owner.id,
    name: skillName,
    description: `${skillName} description`,
  })
  const rubric = await RubricFactory.create()

  return QuestionFactory.merge({
    skillId: skill.id,
    rubricId: rubric.id,
  }).create()
}

async function callDeleteQuestion(
  client: ApiClient,
  authenticatedUser: User,
  questionId: string,
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
        name: 'delete_question',
        arguments: { questionId },
      },
    })
}
