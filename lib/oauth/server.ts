import env from '#start/env'
import { getOAuthSupportedScopes } from '#lib/oauth/resources'

export const oauthServer = {
  issuer: env.get('APP_URL'),
  authorizationEndpoint: `${env.get('FRONTEND_URL')}/oauth/authorize`,
  tokenEndpoint: `${env.get('APP_URL')}/oauth/token`,
  tokenEndpointAuthMethods: ['none'],
  responseTypes: ['code'],
  grantTypes: ['authorization_code'],
  codeChallengeMethods: ['S256'],
  scopes: getOAuthSupportedScopes(),
  authorizationCodeTtlSeconds: 10 * 60,
  accessTokenTtlSeconds: 30 * 24 * 60 * 60,
}
