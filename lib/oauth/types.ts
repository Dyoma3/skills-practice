export type OAuthClientConfig<TScope extends string = string> = {
  id: string
  name?: string
  redirectUris: readonly string[]
  redirectUriPatterns?: readonly string[]
  allowedScopes: readonly TScope[]
}

export type OAuthResourceConfig<TScope extends string = string> = {
  resource: string
  protectedResourceMetadataUrl: string
  scopes: readonly TScope[]
  clients: readonly OAuthClientConfig<TScope>[]
}
