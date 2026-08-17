/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  web: {
    login: typeof routes['web.login'] & {
      store: typeof routes['web.login.store']
    }
    account: typeof routes['web.account']
    logout: typeof routes['web.logout']
  }
  mcps: typeof routes['mcps']
  oauth: {
    getMcpProtectedResource: typeof routes['oauth.get_mcp_protected_resource']
    getAuthorizationServer: typeof routes['oauth.get_authorization_server']
    token: typeof routes['oauth.token']
    showAuthorization: typeof routes['oauth.show_authorization']
    approveAuthorization: typeof routes['oauth.approve_authorization']
    denyAuthorization: typeof routes['oauth.deny_authorization']
  }
}
