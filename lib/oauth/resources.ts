import { mcpOAuth } from '#lib/oauth/mcp'
import type { OAuthResourceConfig } from '#lib/oauth/types'

export const oauthResources = [mcpOAuth] satisfies readonly OAuthResourceConfig[]

export function getOAuthResource(resource: string) {
  return oauthResources.find((candidate) => candidate.resource === resource)
}

export function getOAuthSupportedScopes() {
  return [...new Set(oauthResources.flatMap((resource) => resource.scopes))]
}
