import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

test.group('Web sessions', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('renders the login page', async ({ client }) => {
    const response = await client.get('/login')

    response.assertStatus(200)
    response.assertHeader('content-type', 'text/html; charset=utf-8')
    response.assertTextIncludes('Log in')
    response.assertTextIncludes("name='_csrf'")
  })

  test('redirects authenticated users away from login', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client.get('/login').redirects(0).withGuard('web').loginAs(user)

    response.assertStatus(302)
    response.assertHeader('location', '/account')
  })

  test('requires a CSRF token when logging in', async ({ client }) => {
    const response = await client.post('/login').redirects(0).header('referer', '/login').form({
      email: 'missing@example.com',
      password: 'invalid-password',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('rejects invalid credentials in the login page', async ({ client }) => {
    const response = await client.post('/login').redirects(0).withCsrfToken().form({
      email: 'missing@example.com',
      password: 'invalid-password',
    })

    response.assertStatus(422)
    response.assertTextIncludes('Invalid email or password')
  })

  test('creates a web session with valid credentials', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client.post('/login').redirects(0).withCsrfToken().form({
      email: user.email,
      password: 'password123',
    })

    response.assertStatus(302)
    response.assertHeader('location', '/account')
    response.assertCookie('adonis-session')
  })

  test('returns to the intended URL after login', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .post('/login')
      .redirects(0)
      .withSession({ 'redirect.intendedUrl': '/oauth/authorize?client_id=test-client' })
      .withCsrfToken()
      .form({
        email: user.email,
        password: 'password123',
      })

    response.assertStatus(302)
    response.assertHeader('location', '/oauth/authorize?client_id=test-client')
  })

  test('redirects guests from the account page to login', async ({ client }) => {
    const response = await client.get('/account').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('renders the account page for a web session', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client.get('/account').withGuard('web').loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('You’re logged in.')
    response.assertTextIncludes(user.email)
  })

  test('logs out a web session', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .post('/logout')
      .redirects(0)
      .withGuard('web')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})
