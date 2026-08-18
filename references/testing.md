# Testing

## Commands

Prefer repository scripts. Common focused commands include:

```bash
npm run test
node ace test functional
node ace test mcp
node ace test unit
node ace test --files "tests/functional/resources.spec.ts"
```

## Functional Tests

Use Japa and named-route requests when the v7 API client registry is configured:

```typescript
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Resources store', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates a resource', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .visit('resources.store')
      .loginAs(user)
      .json({ name: 'Example', quantity: 10 })

    response.assertStatus(201)
    response.assertBodyContains({ name: 'Example', quantity: 10 })
  })
})
```

Use explicit methods and URLs only when testing routing behavior itself or when the generated API
client is not configured.

## Database Isolation

- Register migration setup in `tests/bootstrap.ts` when the repository follows the standard v7
  test setup.
- Use `testUtils.db().withGlobalTransaction()` for compatible single-connection tests.
- Use `testUtils.db().truncate()` for HTTP tests, multiple connections, or committed transaction
  behavior.
- Reset per test by default. Share group fixtures only when tests are intentionally read-only or
  the repository has a proven isolation strategy.

## Coverage Expectations

For changed HTTP behavior, test:

- success and persistence side effects
- Zod validation failures and the repository's error envelope
- unauthenticated and unauthorized access
- transformer response shape, variants, and relationship loading
- route parameters, query coercion, and pagination metadata

For HTTP action services, prefer functional endpoint tests because middleware, request context,
authorization, and serialization are part of the behavior. Directly test transport-neutral service
methods when their domain behavior is meaningful in isolation.

## MCP Tests

Keep MCP tests in the repository's MCP suite. Assert JSON-RPC/tool semantics, strict
`structuredContent`, and tool errors. Test individual behavior under the owning domain rather than
asserting the entire global tool list unless registry behavior is the subject.

## Queues and Factories

Use Lucid factories from `database/factories` for focused records and relationships. For queues,
use the existing BullMQ test adapter/mocks or the `@adonisjs/queue` fake—whichever the repository
already uses—and assert payloads without running unrelated workers.
