import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('POST /api/v1/auth/signup', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('creates a user with separate first and last names', async ({ client }) => {
    const response = await client.post('/api/v1/auth/signup').json({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: `ada-${randomUUID()}@example.com`,
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        user: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          initials: 'AL',
        },
      },
    })
  })
})
