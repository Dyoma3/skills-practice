import { test } from '@japa/runner'
import OAuthRedirectUriMatcher from '#lib/oauth/redirect_uri'
import type { OAuthClientConfig } from '#lib/oauth/types'

const client: OAuthClientConfig = {
  id: 'test-client',
  redirectUris: ['https://client.example/oauth/callback'],
  redirectUriPatterns: ['https://chatgpt.com/connector/oauth/:connectorId'],
  allowedScopes: ['mcp:read'],
}

function redirectUriIsAllowed(redirectUri: string, config: OAuthClientConfig = client) {
  return new OAuthRedirectUriMatcher(config, redirectUri).execute()
}

test.group('OAuthRedirectUriMatcher', () => {
  test('allows exact redirect URI matches', ({ assert }) => {
    assert.isTrue(redirectUriIsAllowed('https://client.example/oauth/callback'))
  })

  test('allows named path segment redirect URI pattern matches', ({ assert }) => {
    assert.isTrue(redirectUriIsAllowed('https://chatgpt.com/connector/oauth/Caw9Tvne-u1F'))
  })

  test('rejects redirect URI pattern matches on a different origin', ({ assert }) => {
    assert.isFalse(redirectUriIsAllowed('https://attacker.example/connector/oauth/Caw9Tvne-u1F'))
  })

  test('rejects redirect URI pattern matches on sibling paths', ({ assert }) => {
    assert.isFalse(redirectUriIsAllowed('https://chatgpt.com/connector/oauthevil/Caw9Tvne-u1F'))
  })

  test('rejects redirect URI pattern matches with extra path segments', ({ assert }) => {
    assert.isFalse(redirectUriIsAllowed('https://chatgpt.com/connector/oauth/Caw9Tvne-u1F/extra'))
  })

  test('rejects redirect URI pattern segments with encoded separators', ({ assert }) => {
    assert.isFalse(redirectUriIsAllowed('https://chatgpt.com/connector/oauth/..%2F..%2Fauth%2Fx'))
  })

  test('rejects non-HTTPS redirect URI patterns', ({ assert }) => {
    const plaintextPatternClient: OAuthClientConfig = {
      id: 'plaintext-pattern-client',
      redirectUris: [],
      redirectUriPatterns: ['http://client.example/oauth/callback/:id'],
      allowedScopes: ['mcp:read'],
    }

    assert.isFalse(
      redirectUriIsAllowed('http://client.example/oauth/callback/abc', plaintextPatternClient)
    )
  })

  test('allows dynamic ports and callback subpaths for loopback clients', ({ assert }) => {
    const loopbackClient: OAuthClientConfig = {
      id: 'native-client',
      redirectUris: ['http://127.0.0.1/callback'],
      allowedScopes: ['mcp:read'],
    }

    assert.isTrue(
      redirectUriIsAllowed('http://127.0.0.1:59137/callback/--52FXdsbEbv', loopbackClient)
    )
  })
})
