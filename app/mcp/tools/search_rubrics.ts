import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import RubricSearchService from '#services/rubric/search'
import { searchValidator } from '#validators/rubric'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function searchRubricsTool(ctx: HttpContext): McpTool {
  return { name: 'search_rubrics', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const rubricOutput = z.strictObject({
  id: z.uuid(),
  type: z.enum(RubricTypes),
  name: z.string(),
  description: z.string(),
  maxScore: z.number().int().positive(),
  data: z.record(z.string(), z.number().int().positive()),
})

const searchRubricsOutputSchema = {
  data: z.array(rubricOutput),
  total: z.number(),
}

const searchRubricsOutput = z.strictObject(searchRubricsOutputSchema)

const config = {
  title: 'Search rubrics',
  description:
    'Searches the shared Skills Practice rubric catalog by optional name or description text and rubric type.',
  inputSchema: searchValidator.shape,
  outputSchema: searchRubricsOutputSchema,
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
    const structuredContent = searchRubricsOutput.parse(await searchRubrics(ctx, input))

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

async function searchRubrics(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(RubricSearchService)

  return service.execute(input)
}
