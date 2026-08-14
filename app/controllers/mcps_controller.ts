import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import McpHandlerService from '#services/mcp/handler'

export default class McpsController {
  @inject()
  handle(_ctx: HttpContext, handler: McpHandlerService) {
    return handler.execute()
  }
}
