import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import AttemptStoreService from '#services/attempt/store'
import { storeValidator } from '#validators/attempt'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function createAttemptTool(ctx: HttpContext): McpTool {
  return { name: 'create_attempt', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const createAttemptOutputSchema = {
  id: z.uuid(),
  questionId: z.uuid(),
  response: z.string(),
  score: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
  createdAt: z.string(),
}

const createAttemptOutput = z.strictObject(createAttemptOutputSchema)

const config = {
  title: 'Create attempt',
  description:
    "Appends an immutable practice attempt for the authenticated Skills Practice user's question, calculating its score from the fulfilled rubric criteria.",
  inputSchema: storeValidator.shape,
  outputSchema: createAttemptOutputSchema,
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
    const structuredContent = createAttemptOutput.parse(await createAttempt(ctx, input))

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

async function createAttempt(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(AttemptStoreService)

  return service.execute(input)
}
