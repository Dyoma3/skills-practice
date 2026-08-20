import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Skill from '#models/skill'
import { QuestionFactory } from '#database/factories/question_factory'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp get_question', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('gets an owned question with its complete rubric', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Capacity estimation')
    const rubric = await RubricFactory.merge({
      type: RubricTypes.Criteria,
      name: 'Capacity reasoning',
      description: 'Checks the capacity calculation',
      data: {
        'states assumptions': 1,
        'shows calculation': 2,
      },
    }).create()
    const question = await QuestionFactory.merge({
      skillId: skill.id,
      rubricId: rubric.id,
      prompt: 'Estimate requests per second.',
      context: 'There are 100 million daily requests.',
      answer: '100 million divided by 86,400 is approximately 1,157 requests per second.',
    }).create()

    const response = await callGetQuestion(client, user, { questionId: question.id })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      id: question.id,
      skillId: skill.id,
      rubricId: rubric.id,
      prompt: 'Estimate requests per second.',
      context: 'There are 100 million daily requests.',
      answer: '100 million divided by 86,400 is approximately 1,157 requests per second.',
      rubric: {
        id: rubric.id,
        type: RubricTypes.Criteria,
        name: 'Capacity reasoning',
        description: 'Checks the capacity calculation',
        maxScore: 3,
        data: {
          'states assumptions': 1,
          'shows calculation': 2,
        },
      },
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test("rejects another user's question", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherSkill = await createSkill(otherUser, 'Other user skill')
    const rubric = await RubricFactory.create()
    const question = await QuestionFactory.merge({
      skillId: otherSkill.id,
      rubricId: rubric.id,
    }).create()

    const response = await callGetQuestion(client, user, { questionId: question.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Read protected skill')
    const rubric = await RubricFactory.create()
    const question = await QuestionFactory.merge({
      skillId: skill.id,
      rubricId: rubric.id,
    }).create()

    const response = await callGetQuestion(client, user, { questionId: question.id }, ['mcp:write'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })
})

function createSkill(owner: User, name: string) {
  return Skill.create({
    userId: owner.id,
    name,
    description: `${name} description`,
  })
}

async function callGetQuestion(
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
        name: 'get_question',
        arguments: arguments_,
      },
    })
}
