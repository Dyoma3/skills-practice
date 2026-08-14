import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class BadRequestException extends Exception {
  static status = 422

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(this.status).send(error.message)
  }

  async report() {}
}
