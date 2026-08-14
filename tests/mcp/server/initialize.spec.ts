import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import type User from '#models/user'
import { createUser } from '#tests/helpers/user'
import { getMcpHeaders, mcpHeaders, parseMcpEvent } from '../helpers.js'

let user: User

test.group('POST /mcp initialize', (group) => {
  group.each.setup(async () => {
    const rollback = await testUtils.db().wrapInGlobalTransaction()
    user = await createUser()
    return rollback
  })

  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {
        name: 'skills-practice-test-client',
        version: '1.0.0',
      },
    },
  }

  test('requires an MCP access token', async ({ client }) => {
    const response = await client.post('/mcp').headers(mcpHeaders).json(request)

    response.assertStatus(401)
  })

  test('initializes the Skills Practice MCP server', async ({ assert, client }) => {
    const response = await client
      .post('/mcp')
      .headers(await getMcpHeaders(user))
      .json(request)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/event-stream')

    const mcpResponse = parseMcpEvent(response.text())

    assert.equal(mcpResponse.jsonrpc, '2.0')
    assert.equal(mcpResponse.id, 1)
    assert.deepInclude(mcpResponse.result, {
      protocolVersion: '2025-03-26',
      serverInfo: {
        name: 'skills-practice',
        version: '0.1.0',
      },
    })
    assert.notProperty(mcpResponse.result.capabilities, 'tools')
  })
})
