import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import type User from '#models/user'
import type Question from '#models/question'
import Skill from '#models/skill'
import { AttemptFactory } from '#database/factories/attempt_factory'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp search_attempts', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test("returns only the authenticated user's attempt history", async ({ assert, client }) => {
    const question = await createQuestion(user, 'Owned history')
    const firstAttempt = await createAttempt(question, '2026-01-01T10:00:00.000Z', 'First response')
    const secondAttempt = await createAttempt(
      question,
      '2026-01-02T10:00:00.000Z',
      'Second response'
    )

    const otherUser = await UserFactory.create()
    const otherQuestion = await createQuestion(otherUser, 'Other user history')
    await createAttempt(otherQuestion, '2026-01-03T10:00:00.000Z', 'Other user response')

    const response = await callSearchAttempts(client, user, { questionId: question.id })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.equal(result.total, 2)
    assert.deepEqual(
      result.data.map((attempt: { id: string }) => attempt.id),
      [secondAttempt.id, firstAttempt.id]
    )
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('filters by exact skill and paginates results', async ({ assert, client }) => {
    const selectedQuestion = await createQuestion(user, 'Selected skill')
    const otherQuestion = await createQuestion(user, 'Other skill')
    await createAttempt(selectedQuestion, '2026-01-01T10:00:00.000Z', 'Selected first')
    await createAttempt(selectedQuestion, '2026-01-02T10:00:00.000Z', 'Selected second')
    await createAttempt(otherQuestion, '2026-01-03T10:00:00.000Z', 'Other attempt')

    const response = await callSearchAttempts(client, user, {
      skillId: selectedQuestion.skillId,
      page: 1,
      pageSize: 1,
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent
    assert.equal(result.total, 2)
    assert.lengthOf(result.data, 1)
    assert.equal(result.data[0].questionId, selectedQuestion.id)
  })

  test("rejects filtering by another user's question", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherQuestion = await createQuestion(otherUser, 'Other user filter')

    const response = await callSearchAttempts(client, user, { questionId: otherQuestion.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const response = await callSearchAttempts(client, user, {}, ['mcp:write'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
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

function createAttempt(question: Question, createdAt: string, response: string) {
  return AttemptFactory.merge({
    questionId: question.id,
    response,
    createdAt: DateTime.fromISO(createdAt),
  }).create()
}

async function callSearchAttempts(
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
        name: 'search_attempts',
        arguments: arguments_,
      },
    })
}
