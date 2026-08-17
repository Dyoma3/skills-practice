/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'web.login': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['web.login']['types'],
  },
  'web.login.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['web.login.store']['types'],
  },
  'web.account': {
    methods: ["GET","HEAD"],
    pattern: '/account',
    tokens: [{"old":"/account","type":0,"val":"account","end":""}],
    types: placeholder as Registry['web.account']['types'],
  },
  'web.logout': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['web.logout']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'mcps': {
    methods: ["HEAD","OPTIONS","GET","POST","PUT","PATCH","DELETE"],
    pattern: '/mcp',
    tokens: [{"old":"/mcp","type":0,"val":"mcp","end":""}],
    types: placeholder as Registry['mcps']['types'],
  },
  'oauth.get_mcp_protected_resource': {
    methods: ["GET","HEAD"],
    pattern: '/.well-known/oauth-protected-resource/mcp',
    tokens: [{"old":"/.well-known/oauth-protected-resource/mcp","type":0,"val":".well-known","end":""},{"old":"/.well-known/oauth-protected-resource/mcp","type":0,"val":"oauth-protected-resource","end":""},{"old":"/.well-known/oauth-protected-resource/mcp","type":0,"val":"mcp","end":""}],
    types: placeholder as Registry['oauth.get_mcp_protected_resource']['types'],
  },
  'oauth.get_authorization_server': {
    methods: ["GET","HEAD"],
    pattern: '/.well-known/oauth-authorization-server',
    tokens: [{"old":"/.well-known/oauth-authorization-server","type":0,"val":".well-known","end":""},{"old":"/.well-known/oauth-authorization-server","type":0,"val":"oauth-authorization-server","end":""}],
    types: placeholder as Registry['oauth.get_authorization_server']['types'],
  },
  'oauth.token': {
    methods: ["POST"],
    pattern: '/oauth/token',
    tokens: [{"old":"/oauth/token","type":0,"val":"oauth","end":""},{"old":"/oauth/token","type":0,"val":"token","end":""}],
    types: placeholder as Registry['oauth.token']['types'],
  },
  'oauth.approve_authorization': {
    methods: ["POST"],
    pattern: '/oauth/authorize/approve',
    tokens: [{"old":"/oauth/authorize/approve","type":0,"val":"oauth","end":""},{"old":"/oauth/authorize/approve","type":0,"val":"authorize","end":""},{"old":"/oauth/authorize/approve","type":0,"val":"approve","end":""}],
    types: placeholder as Registry['oauth.approve_authorization']['types'],
  },
  'oauth.deny_authorization': {
    methods: ["POST"],
    pattern: '/oauth/authorize/deny',
    tokens: [{"old":"/oauth/authorize/deny","type":0,"val":"oauth","end":""},{"old":"/oauth/authorize/deny","type":0,"val":"authorize","end":""},{"old":"/oauth/authorize/deny","type":0,"val":"deny","end":""}],
    types: placeholder as Registry['oauth.deny_authorization']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
