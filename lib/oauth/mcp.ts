import env from '#start/env'
import type { OAuthClientConfig, OAuthResourceConfig } from '#lib/oauth/types'

export const mcpOAuthScopes = ['mcp:read', 'mcp:write'] as const

export type McpOAuthScope = (typeof mcpOAuthScopes)[number]

const mcpOAuthClients: OAuthClientConfig<McpOAuthScope>[] = [
  {
    id: 'claude',
    name: 'Claude',
    redirectUris: ['https://claude.ai/api/mcp/auth_callback'],
    allowedScopes: [...mcpOAuthScopes],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    redirectUris: ['https://chatgpt.com/connector_platform_oauth_redirect'],
    redirectUriPatterns: ['https://chatgpt.com/connector/oauth/:connectorId'],
    allowedScopes: [...mcpOAuthScopes],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    redirectUris: ['http://localhost/callback', 'http://127.0.0.1/callback'],
    allowedScopes: [...mcpOAuthScopes],
  },
  {
    id: 'codex',
    name: 'Codex',
    redirectUris: ['http://localhost/callback', 'http://127.0.0.1/callback'],
    allowedScopes: [...mcpOAuthScopes],
  },
]

export const mcpOAuth: OAuthResourceConfig<McpOAuthScope> = {
  resource: `${env.get('APP_URL')}/mcp`,
  protectedResourceMetadataUrl: `${env.get('APP_URL')}/.well-known/oauth-protected-resource/mcp`,
  scopes: [...mcpOAuthScopes],
  clients: mcpOAuthClients,
}
