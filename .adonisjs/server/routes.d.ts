import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'web.login': { paramsTuple?: []; params?: {} }
    'web.login.store': { paramsTuple?: []; params?: {} }
    'web.account': { paramsTuple?: []; params?: {} }
    'web.logout': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'mcps': { paramsTuple?: []; params?: {} }
    'oauth.get_mcp_protected_resource': { paramsTuple?: []; params?: {} }
    'oauth.get_authorization_server': { paramsTuple?: []; params?: {} }
    'oauth.token': { paramsTuple?: []; params?: {} }
    'oauth.approve_authorization': { paramsTuple?: []; params?: {} }
    'oauth.deny_authorization': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'web.login': { paramsTuple?: []; params?: {} }
    'web.account': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'mcps': { paramsTuple?: []; params?: {} }
    'oauth.get_mcp_protected_resource': { paramsTuple?: []; params?: {} }
    'oauth.get_authorization_server': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'web.login': { paramsTuple?: []; params?: {} }
    'web.account': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'mcps': { paramsTuple?: []; params?: {} }
    'oauth.get_mcp_protected_resource': { paramsTuple?: []; params?: {} }
    'oauth.get_authorization_server': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'web.login.store': { paramsTuple?: []; params?: {} }
    'web.logout': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'mcps': { paramsTuple?: []; params?: {} }
    'oauth.token': { paramsTuple?: []; params?: {} }
    'oauth.approve_authorization': { paramsTuple?: []; params?: {} }
    'oauth.deny_authorization': { paramsTuple?: []; params?: {} }
  }
  OPTIONS: {
    'mcps': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'mcps': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'mcps': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'mcps': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}