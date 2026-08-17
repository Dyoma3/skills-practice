import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class WebAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.request.request.headers.accept = 'text/html'
    await ctx.auth.authenticateUsing(['web'], { loginRoute: '/login' })
    return next()
  }
}
