import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp update_rubric', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('updates rubric metadata without updating its scoring data', async ({ assert, client }) => {
    const rubric = await RubricFactory.merge({
      type: RubricTypes.Binary,
      name: 'Original rubric',
      description: 'Original rubric description',
      data: {
        'states the answer': 1,
      },
    }).create()

    const response = await callUpdateRubric(client, user, {
      rubricId: rubric.id,
      type: RubricTypes.Criteria,
      name: 'Updated rubric',
      description: 'Updated rubric description',
      data: {
        'replacement criterion': 99,
      },
      maxScore: 99,
    })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.deepInclude(result, {
      id: rubric.id,
      type: RubricTypes.Criteria,
      name: 'Updated rubric',
      description: 'Updated rubric description',
      maxScore: 1,
      data: {
        'states the answer': 1,
      },
    })
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)

    await rubric.refresh()
    assert.equal(rubric.type, RubricTypes.Criteria)
    assert.equal(rubric.name, 'Updated rubric')
    assert.equal(rubric.description, 'Updated rubric description')
    assert.equal(rubric.maxScore, 1)
    assert.deepEqual(rubric.data, { 'states the answer': 1 })
  })

  test('requires at least one field to update', async ({ assert, client }) => {
    const rubric = await RubricFactory.create()

    const response = await callUpdateRubric(client, user, { rubricId: rubric.id })

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.include(mcpError.content[0].text, 'At least one field must be provided')
  })

  test('requires the mcp:write scope', async ({ assert, client }) => {
    const rubric = await RubricFactory.merge({ name: 'Read only rubric' }).create()

    const response = await callUpdateRubric(
      client,
      user,
      { rubricId: rubric.id, name: 'Unauthorized name' },
      ['mcp:read']
    )

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')

    await rubric.refresh()
    assert.equal(rubric.name, 'Read only rubric')
  })
})

async function callUpdateRubric(
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
        name: 'update_rubric',
        arguments: arguments_,
      },
    })
}
