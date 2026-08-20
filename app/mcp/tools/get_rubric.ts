import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import RubricShowService from '#services/rubric/show'
import { showValidator } from '#validators/rubric'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function getRubricTool(ctx: HttpContext): McpTool {
  return { name: 'get_rubric', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const getRubricOutputSchema = {
  id: z.uuid(),
  type: z.enum(RubricTypes),
  name: z.string(),
  description: z.string(),
  maxScore: z.number().int().positive(),
  data: z.record(z.string(), z.number().int().positive()),
}

const getRubricOutput = z.strictObject(getRubricOutputSchema)

const config = {
  title: 'Get rubric',
  description:
    'Returns a rubric from the shared Skills Practice catalog, including its criterion-to-points data.',
  inputSchema: showValidator.shape,
  outputSchema: getRubricOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies McpTool['config']

// ### CALLBACK ###

function createCallback(ctx: HttpContext): McpTool['callback'] {
  return async (input) => {
    const structuredContent = getRubricOutput.parse(await getRubric(ctx, input))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(structuredContent, null, 2),
        },
      ],
      structuredContent,
    }
  }
}

async function getRubric(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(RubricShowService)

  return service.execute(input)
}
