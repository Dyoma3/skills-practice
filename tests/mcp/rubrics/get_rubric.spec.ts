import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp get_rubric', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('gets a rubric from the shared catalog', async ({ assert, client }) => {
    const rubric = await RubricFactory.merge({
      type: RubricTypes.Criteria,
      name: 'System design reasoning',
      description: 'Checks assumptions and tradeoffs',
      data: {
        'states assumptions': 1,
        'explains tradeoffs': 2,
      },
    }).create()

    const response = await callGetRubric(client, user, { rubricId: rubric.id })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepEqual(result, {
      id: rubric.id,
      type: RubricTypes.Criteria,
      name: 'System design reasoning',
      description: 'Checks assumptions and tradeoffs',
      maxScore: 3,
      data: {
        'states assumptions': 1,
        'explains tradeoffs': 2,
      },
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()
    const response = await callGetRubric(client, user, { rubricId: rubric.id }, ['mcp:write'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })
})

async function callGetRubric(
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
        name: 'get_rubric',
        arguments: arguments_,
      },
    })
}
