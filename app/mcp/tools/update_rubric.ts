import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import RubricUpdateService from '#services/rubric/update'
import { updateValidator } from '#validators/rubric'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function updateRubricTool(ctx: HttpContext): McpTool {
  return { name: 'update_rubric', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const updateRubricOutputSchema = {
  id: z.uuid(),
  type: z.enum(RubricTypes),
  name: z.string(),
  description: z.string(),
  maxScore: z.number().int().positive(),
  data: z.record(z.string(), z.number().int().positive()),
}

const updateRubricOutput = z.strictObject(updateRubricOutputSchema)

const config = {
  title: 'Update rubric',
  description:
    'Updates the type, name, or description of a rubric in the shared Skills Practice catalog. Scoring data and maximum score cannot be updated.',
  inputSchema: updateValidator.shape,
  outputSchema: updateRubricOutputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies McpTool['config']

// ### CALLBACK ###

function createCallback(ctx: HttpContext): McpTool['callback'] {
  return async (input) => {
    const structuredContent = updateRubricOutput.parse(await updateRubric(ctx, input))

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

async function updateRubric(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(RubricUpdateService)

  return service.execute(input)
}
