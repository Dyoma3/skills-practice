import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { mcpOAuth } from '#lib/oauth/mcp'

export default class McpAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await ctx.auth.authenticateUsing(['mcp'])
      return next()
    } catch (error) {
      if (!(error instanceof errors.E_UNAUTHORIZED_ACCESS)) {
        throw error
      }

      ctx.response.header(
        'WWW-Authenticate',
        `Bearer resource_metadata="${mcpOAuth.protectedResourceMetadataUrl}"`
      )

      return ctx.response.unauthorized({ error: 'Unauthorized' })
    }
  }
}
