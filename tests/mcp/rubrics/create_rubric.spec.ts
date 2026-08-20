import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import Rubric from '#models/rubric'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp create_rubric', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('creates a shared rubric and derives its maximum score', async ({ assert, client }) => {
    const response = await callCreateRubric(client, user, {
      type: RubricTypes.Criteria,
      name: 'Capacity estimation',
      description: 'Scores the reasoning behind a capacity estimate',
      data: {
        'states the assumptions': 1,
        'shows the calculation': 2,
        'mentions the limiting factor': 3,
      },
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      type: RubricTypes.Criteria,
      name: 'Capacity estimation',
      description: 'Scores the reasoning behind a capacity estimate',
      maxScore: 6,
      data: {
        'states the assumptions': 1,
        'shows the calculation': 2,
        'mentions the limiting factor': 3,
      },
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    const storedRubric = await Rubric.findOrFail(result.id)
    assert.equal(storedRubric.maxScore, 6)
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const response = await callCreateRubric(
      client,
      user,
      {
        type: RubricTypes.Binary,
        name: 'Read only rubric',
        description: 'Must not be created',
        data: { correct: 1 },
      },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
    assert.isNull(await Rubric.findBy('name', 'Read only rubric'))
  })

  test('rejects rubric data without criteria', async ({ assert, client }) => {
    const response = await callCreateRubric(client, user, {
      type: RubricTypes.Criteria,
      name: 'Empty rubric',
      description: 'Must not be created',
      data: {},
    })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.include(mcpError.content[0].text, 'Rubric data must contain at least one criterion')
    assert.isNull(await Rubric.findBy('name', 'Empty rubric'))
  })
})

async function callCreateRubric(
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
        name: 'create_rubric',
        arguments: arguments_,
      },
    })
}
