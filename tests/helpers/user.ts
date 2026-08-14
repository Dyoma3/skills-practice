import { randomUUID } from 'node:crypto'
import User from '#models/user'

export function createUser() {
  return User.create({
    fullName: 'OAuth Test User',
    email: `oauth-${randomUUID()}@example.com`,
    password: 'password123',
  })
}
