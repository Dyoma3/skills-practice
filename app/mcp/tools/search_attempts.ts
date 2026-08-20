import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import AttemptSearchService from '#services/attempt/search'
import { searchValidator } from '#validators/attempt'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function searchAttemptsTool(ctx: HttpContext): McpTool {
  return { name: 'search_attempts', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const attemptOutput = z.strictObject({
  id: z.uuid(),
  questionId: z.uuid(),
  response: z.string(),
  score: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
  createdAt: z.string(),
})

const searchAttemptsOutputSchema = {
  data: z.array(attemptOutput),
  total: z.number(),
}

const searchAttemptsOutput = z.strictObject(searchAttemptsOutputSchema)

const config = {
  title: 'Search attempts',
  description:
    "Returns the authenticated Skills Practice user's immutable attempt history, optionally filtered by exact question or skill, with pagination.",
  inputSchema: searchValidator.shape,
  outputSchema: searchAttemptsOutputSchema,
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
    const structuredContent = searchAttemptsOutput.parse(await searchAttempts(ctx, input))

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

async function searchAttempts(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(AttemptSearchService)

  return service.execute(input)
}
