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

test.group('POST /mcp search_questions', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test("searches only the authenticated user's questions by prompt or context", async ({
    assert,
    client,
  }) => {
    const rubric = await RubricFactory.create()
    const skill = await createSkill(user, 'System design')
    const matchingByPrompt = await createQuestion(
      skill,
      rubric.id,
      'System availability tradeoffs',
      null
    )
    const matchingByContext = await createQuestion(
      skill,
      rubric.id,
      'Capacity estimation',
      'Estimate a system workload'
    )
    await createQuestion(skill, rubric.id, 'Database indexing', 'Choose an effective index')

    const otherUser = await UserFactory.create()
    const otherSkill = await createSkill(otherUser, 'Other user skill')
    await createQuestion(otherSkill, rubric.id, 'Other system question', null)

    const response = await callSearchQuestions(client, user, { search: 'SYSTEM' })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.equal(result.total, 2)
    assert.deepEqual(
      result.data.map((question: { id: string }) => question.id),
      [matchingByContext.id, matchingByPrompt.id]
    )
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('filters by exact skill and paginates results', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()
    const selectedSkill = await createSkill(user, 'Selected skill')
    const otherSkill = await createSkill(user, 'Other skill')
    await createQuestion(selectedSkill, rubric.id, 'Selected alpha', null)
    await createQuestion(selectedSkill, rubric.id, 'Selected beta', null)
    await createQuestion(otherSkill, rubric.id, 'Other question', null)

    const response = await callSearchQuestions(client, user, {
      skillId: selectedSkill.id,
      page: 1,
      pageSize: 1,
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent
    assert.equal(result.total, 2)
    assert.lengthOf(result.data, 1)
    assert.equal(result.data[0].skillId, selectedSkill.id)
  })

  test("rejects filtering by another user's skill", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherSkill = await createSkill(otherUser, 'Other user filter')

    const response = await callSearchQuestions(client, user, { skillId: otherSkill.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const response = await callSearchQuestions(client, user, {}, ['mcp:write'])

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

function createQuestion(skill: Skill, rubricId: string, prompt: string, context: string | null) {
  return QuestionFactory.merge({
    skillId: skill.id,
    rubricId,
    prompt,
    context,
    answer: null,
  }).create()
}

async function callSearchQuestions(
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
        name: 'search_questions',
        arguments: arguments_,
      },
    })
}
