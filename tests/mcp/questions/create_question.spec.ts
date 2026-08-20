import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Question from '#models/question'
import Skill from '#models/skill'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp create_question', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('creates a reusable question under an owned leaf skill', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Capacity estimation')
    const rubric = await RubricFactory.create()

    const response = await callCreateQuestion(client, user, {
      skillId: skill.id,
      rubricId: rubric.id,
      prompt: 'Estimate the peak request rate for this workload.',
      context: 'There are 100 million daily active users.',
      answer: 'Divide the daily request count by 86,400 and apply the peak multiplier.',
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      skillId: skill.id,
      rubricId: rubric.id,
      prompt: 'Estimate the peak request rate for this workload.',
      context: 'There are 100 million daily active users.',
      answer: 'Divide the daily request count by 86,400 and apply the peak multiplier.',
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    const storedQuestion = await Question.findOrFail(result.id)
    assert.equal(storedQuestion.skillId, skill.id)
    assert.equal(storedQuestion.rubricId, rubric.id)
  })

  test('rejects questions under a non-leaf skill', async ({ assert, client }) => {
    const parent = await createSkill(user, 'System design')
    await Skill.create({
      userId: user.id,
      parentId: parent.id,
      name: 'Capacity estimation',
      description: 'Estimate system capacity',
    })
    const rubric = await RubricFactory.create()

    const response = await callCreateQuestion(client, user, {
      skillId: parent.id,
      rubricId: rubric.id,
      prompt: 'Invalid branch question',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Questions can only be added to leaf skills')
    assert.isNull(await Question.findBy('prompt', 'Invalid branch question'))
  })

  test("rejects another user's skill", async ({ assert, client }) => {
    const otherUser = await UserFactory.create()
    const otherSkill = await createSkill(otherUser, 'Other user skill')
    const rubric = await RubricFactory.create()

    const response = await callCreateQuestion(client, user, {
      skillId: otherSkill.id,
      rubricId: rubric.id,
      prompt: 'Unauthorized question',
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Question.findBy('prompt', 'Unauthorized question'))
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const skill = await createSkill(user, 'Read only skill')
    const rubric = await RubricFactory.create()

    const response = await callCreateQuestion(
      client,
      user,
      {
        skillId: skill.id,
        rubricId: rubric.id,
        prompt: 'Read only question',
      },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Question.findBy('prompt', 'Read only question'))
  })
})

function createSkill(owner: User, name: string) {
  return Skill.create({
    userId: owner.id,
    name,
    description: `${name} description`,
  })
}

async function callCreateQuestion(
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
        name: 'create_question',
        arguments: arguments_,
      },
    })
}
