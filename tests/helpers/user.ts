import { randomUUID } from 'node:crypto'
import User from '#models/user'

export function createUser() {
  return User.create({
    firstName: 'OAuth',
    lastName: 'Test User',
    email: `oauth-${randomUUID()}@example.com`,
    password: 'password123',
  })
}
