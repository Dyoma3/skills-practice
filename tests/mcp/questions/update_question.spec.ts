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

test.group('POST /mcp update_question', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('updates an owned question while preserving its skill and rubric', async ({
    assert,
    client,
  }) => {
    const question = await createQuestion(user, 'Original question')

    const response = await callUpdateQuestion(client, user, {
      questionId: question.id,
      prompt: 'Updated question prompt',
      context: null,
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      id: question.id,
      skillId: question.skillId,
      rubricId: question.rubricId,
      prompt: 'Updated question prompt',
      context: null,
      answer: 'Original reference answer',
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    await question.refresh()
    assert.equal(question.prompt, 'Updated question prompt')
    assert.isNull(question.context)
    assert.equal(question.answer, 'Original reference answer')
  })

  test('requires at least one field to update', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Unchanged question')

    const response = await callUpdateQuestion(client, user, { questionId: question.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.include(mcpError.content[0].text, 'At least one field must be provided')
  })

  test("rejects another user's question", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const question = await createQuestion(otherUser, 'Other user question')

    const response = await callUpdateQuestion(client, user, {
      questionId: question.id,
      prompt: 'Unauthorized prompt',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')

    await question.refresh()
    assert.equal(question.prompt, 'Other user question')
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const question = await createQuestion(user, 'Read only question')

    const response = await callUpdateQuestion(
      client,
      user,
      { questionId: question.id, prompt: 'Unauthorized prompt' },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')

    await question.refresh()
    assert.equal(question.prompt, 'Read only question')
  })
})

async function createQuestion(owner: User, prompt: string) {
  const skill = await Skill.create({
    userId: owner.id,
    name: `${prompt} skill`,
    description: `${prompt} skill description`,
  })
  const rubric = await RubricFactory.create()

  return QuestionFactory.merge({
    skillId: skill.id,
    rubricId: rubric.id,
    prompt,
    context: 'Original context',
    answer: 'Original reference answer',
  }).create()
}

async function callUpdateQuestion(
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
        name: 'update_question',
        arguments: arguments_,
      },
    })
}
