import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Attempt from '#models/attempt'
import Skill from '#models/skill'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp create_attempt', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('calculates the score from fulfilled rubric criteria', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Capacity estimation')

    const response = await callCreateAttempt(client, user, {
      questionId: question.id,
      response: 'The estimate is about 1,200 requests per second.',
      fulfilledCriteria: ['states assumptions', 'shows calculation'],
      feedback: 'The reasoning is clear, but it omits the limiting factor.',
      score: 999,
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      questionId: question.id,
      response: 'The estimate is about 1,200 requests per second.',
      score: 3,
      feedback: 'The reasoning is clear, but it omits the limiting factor.',
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    const storedAttempt = await Attempt.findOrFail(result.id)
    assert.equal(storedAttempt.score, 3)
  })

  test('rejects criteria that do not exist in the question rubric', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Unknown criterion skill')

    const response = await callCreateAttempt(client, user, {
      questionId: question.id,
      response: 'Response using an unknown criterion',
      fulfilledCriteria: ['invented criterion'],
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Unknown rubric criteria: invented criterion')
    assert.isNull(await Attempt.findBy('questionId', question.id))
  })

  test('rejects duplicate fulfilled criteria', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Duplicate criterion skill')

    const response = await callCreateAttempt(client, user, {
      questionId: question.id,
      response: 'Response with duplicate evidence',
      fulfilledCriteria: ['states assumptions', 'states assumptions'],
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.include(mcpError.content[0].text, 'Fulfilled criteria must be unique')
    assert.isNull(await Attempt.findBy('questionId', question.id))
  })

  test("rejects another user's question", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const question = await createQuestion(otherUser, 'Other user question')

    const response = await callCreateAttempt(client, user, {
      questionId: question.id,
      response: 'Unauthorized response',
      fulfilledCriteria: [],
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Attempt.findBy('questionId', question.id))
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Read only question')

    const response = await callCreateAttempt(
      client,
      user,
      {
        questionId: question.id,
        response: 'Read only response',
        fulfilledCriteria: [],
      },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Attempt.findBy('questionId', question.id))
  })
})

async function createQuestion(owner: User, skillName: string) {
  const skill = await Skill.create({
    userId: owner.id,
    name: skillName,
    description: `${skillName} description`,
  })
  const rubric = await RubricFactory.merge({
    type: RubricTypes.Criteria,
    data: {
      'states assumptions': 1,
      'shows calculation': 2,
      'mentions limiting factor': 3,
    },
  }).create()

  return QuestionFactory.merge({
    skillId: skill.id,
    rubricId: rubric.id,
  }).create()
}

async function callCreateAttempt(
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
        name: 'create_attempt',
        arguments: arguments_,
      },
    })
}
