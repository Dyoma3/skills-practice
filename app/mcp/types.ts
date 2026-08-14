import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'

type McpToolOutputSchema = ZodRawShapeCompat | AnySchema
type McpToolInputSchema = undefined | ZodRawShapeCompat | AnySchema

export type McpTool<
  OutputSchema extends McpToolOutputSchema = ZodRawShapeCompat,
  InputSchema extends McpToolInputSchema = ZodRawShapeCompat,
> = {
  name: string
  config: {
    title?: string
    description?: string
    inputSchema?: InputSchema
    outputSchema?: OutputSchema
    annotations?: ToolAnnotations
    _meta?: Record<string, unknown>
  }
  callback: ToolCallback<InputSchema>
}
