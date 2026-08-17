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
    router.get('login', [controllers.WebSessions, 'show']).as('web.login')
    router.post('login', [controllers.WebSessions, 'store']).as('web.login.store')
  })
  .use(middleware.guest({ guards: ['web'] }))

router
  .group(() => {
    router.get('account', [controllers.WebSessions, 'account']).as('web.account')
    router.post('logout', [controllers.WebSessions, 'destroy']).as('web.logout')
  })
  .use(middleware.webAuth())

router.any('mcp', [controllers.Mcps, 'handle']).use(middleware.mcpAuth())

router.get('.well-known/oauth-protected-resource/mcp', [
  controllers.Oauth,
  'getMcpProtectedResource',
])

router.get('.well-known/oauth-authorization-server', [controllers.Oauth, 'getAuthorizationServer'])

router
  .group(() => {
    router.post('token', [controllers.Oauth, 'token'])
    router
      .group(() => {
        router.get('authorize', [controllers.Oauth, 'showAuthorization'])
        router.post('authorize/approve', [controllers.Oauth, 'approveAuthorization'])
        router.post('authorize/deny', [controllers.Oauth, 'denyAuthorization'])
      })
      .use(middleware.webAuth())
  })
  .prefix('oauth')
