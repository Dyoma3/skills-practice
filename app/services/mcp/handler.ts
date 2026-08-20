import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createRubricTool } from '../../mcp/tools/create_rubric.js'
import { createSkillTool } from '../../mcp/tools/create_skill.js'
import { getRubricTool } from '../../mcp/tools/get_rubric.js'
import { getSkillTool } from '../../mcp/tools/get_skill.js'
import { searchRubricsTool } from '../../mcp/tools/search_rubrics.js'
import { searchSkillsTool } from '../../mcp/tools/search_skills.js'
import type { McpTool } from '#mcp/types'

@inject()
export default class McpHandlerService {
  private readonly tools: McpTool[]

  constructor(protected ctx: HttpContext) {
    this.tools = [
      createRubricTool(ctx),
      createSkillTool(ctx),
      getRubricTool(ctx),
      getSkillTool(ctx),
      searchRubricsTool(ctx),
      searchSkillsTool(ctx),
    ]
  }

  async execute() {
    const server = this.createServer()
    const transport = this.createTransport()
    const closeMcpResources = () => {
      void this.closeResources(server, transport)
    }

    this.ctx.response.response.once('close', closeMcpResources)

    try {
      await server.connect(transport)
      await transport.handleRequest(
        this.ctx.request.request,
        this.ctx.response.response,
        this.ctx.request.body()
      )
    } catch (error) {
      this.ctx.logger.error({ err: error }, 'Failed to handle MCP request')
      this.writeInternalErrorResponse()
    }
  }

  private createServer() {
    const server = new McpServer(
      {
        name: 'skills-practice',
        version: '0.1.0',
      },
      {
        instructions:
          "Use Skills Practice tools to access only the authenticated user's data. Never assume access to another user's data.",
      }
    )

    this.registerTools(server)

    return server
  }

  private registerTools(server: McpServer) {
    for (const tool of this.tools) {
      server.registerTool(tool.name, tool.config, tool.callback)
    }
  }

  private createTransport() {
    return new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
  }

  private async closeResources(server: McpServer, transport: StreamableHTTPServerTransport) {
    try {
      await Promise.all([transport.close(), server.close()])
    } catch (error) {
      this.ctx.logger.warn({ err: error }, 'Failed to close MCP request resources')
    }
  }

  private writeInternalErrorResponse() {
    const { response } = this.ctx

    if (response.response.headersSent) return

    response.response.writeHead(500, { 'Content-Type': 'application/json' })
    response.response.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    )
  }
}
