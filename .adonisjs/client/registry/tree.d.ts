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
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  mcps: typeof routes['mcps']
  oauth: {
    getMcpProtectedResource: typeof routes['oauth.get_mcp_protected_resource']
    getAuthorizationServer: typeof routes['oauth.get_authorization_server']
    token: typeof routes['oauth.token']
    approveAuthorization: typeof routes['oauth.approve_authorization']
    denyAuthorization: typeof routes['oauth.deny_authorization']
  }
}
