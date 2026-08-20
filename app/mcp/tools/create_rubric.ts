import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import RubricStoreService from '#services/rubric/store'
import { storeValidator } from '#validators/rubric'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function createRubricTool(ctx: HttpContext): McpTool {
  return { name: 'create_rubric', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const createRubricOutputSchema = {
  id: z.uuid(),
  type: z.enum(RubricTypes),
  name: z.string(),
  description: z.string(),
  maxScore: z.number().int().positive(),
  data: z.record(z.string(), z.number().int().positive()),
}

const createRubricOutput = z.strictObject(createRubricOutputSchema)

const config = {
  title: 'Create rubric',
  description:
    'Creates a reusable rubric in the shared Skills Practice catalog and derives its maximum score from the criterion points.',
  inputSchema: storeValidator.shape,
  outputSchema: createRubricOutputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
} satisfies McpTool['config']

// ### CALLBACK ###

function createCallback(ctx: HttpContext): McpTool['callback'] {
  return async (input) => {
    const structuredContent = createRubricOutput.parse(await createRubric(ctx, input))

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

async function createRubric(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(RubricStoreService)

  return service.execute(input)
}
