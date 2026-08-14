/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')

router.get('.well-known/oauth-protected-resource/mcp', [
  controllers.Oauth,
  'getMcpProtectedResource',
])

router.get('.well-known/oauth-authorization-server', [controllers.Oauth, 'getAuthorizationServer'])

router
  .group(() => {
    router.post('token', [controllers.Oauth, 'token'])
    router
      .post('authorize/approve', [controllers.Oauth, 'approveAuthorization'])
      .use(middleware.auth())
    router.post('authorize/deny', [controllers.Oauth, 'denyAuthorization']).use(middleware.auth())
  })
  .prefix('oauth')
