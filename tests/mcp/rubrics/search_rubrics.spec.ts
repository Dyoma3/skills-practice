import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import { RubricFactory } from '#database/factories/rubric_factory'
import { UserFactory } from '#database/factories/user_factory'
import { RubricTypes } from '#types/index'
import { getMcpHeaders, parseMcpEvent, parseMcpToolError } from '../helpers.js'

let user: User

test.group('POST /mcp search_rubrics', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await UserFactory.create()
    return rollback
  })

  test('searches the shared rubric catalog by name or description', async ({ assert, client }) => {
    const matchingByName = await RubricFactory.merge({
      name: 'System design reasoning',
      description: 'Checks architectural tradeoffs',
    }).create()
    const matchingByDescription = await RubricFactory.merge({
      name: 'Capacity estimation',
      description: 'Checks system assumptions and calculations',
    }).create()
    await RubricFactory.merge({
      name: 'Database indexing',
      description: 'Checks index selection',
    }).create()

    const response = await callSearchRubrics(client, user, { search: 'SYSTEM' })

    response.assertStatus(200)

    const mcpResponse = parseMcpEvent(response.text())
    const result = mcpResponse.result.structuredContent

    assert.equal(result.total, 2)
    assert.deepEqual(
      result.data.map((rubric: { id: string }) => rubric.id),
      [matchingByDescription.id, matchingByName.id]
    )
    assert.deepEqual(JSON.parse(mcpResponse.result.content[0].text), result)
  })

  test('filters by rubric type and paginates results', async ({ assert, client }) => {
    await RubricFactory.merge({
      type: RubricTypes.Binary,
      name: 'Binary alpha',
      data: { correct: 1 },
    }).create()
    await RubricFactory.merge({
      type: RubricTypes.Binary,
      name: 'Binary beta',
      data: { correct: 1 },
    }).create()
    await RubricFactory.merge({
      type: RubricTypes.Criteria,
      name: 'Criteria rubric',
    }).create()

    const response = await callSearchRubrics(client, user, {
      type: RubricTypes.Binary,
      page: 1,
      pageSize: 1,
    })

    response.assertStatus(200)

    const result = parseMcpEvent(response.text()).result.structuredContent
    assert.equal(result.total, 2)
    assert.lengthOf(result.data, 1)
    assert.equal(result.data[0].type, RubricTypes.Binary)
  })

  test('requires the mcp:read scope', async ({ assert, client }) => {
    const response = await callSearchRubrics(client, user, {}, ['mcp:write'])

    response.assertStatus(200)

    const mcpError = parseMcpToolError(response.text())
    assert.equal(mcpError.content[0].text, 'Access denied')
  })
})

async function callSearchRubrics(
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
        name: 'search_rubrics',
        arguments: arguments_,
      },
    })
}
