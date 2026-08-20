import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import AttemptShowService from '#services/attempt/show'
import { showValidator } from '#validators/attempt'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function getAttemptTool(ctx: HttpContext): McpTool {
  return { name: 'get_attempt', config, callback: createCallback(ctx) }
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

const questionOutput = z.strictObject({
  id: z.uuid(),
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string(),
  context: z.string().nullable(),
  answer: z.string().nullable(),
  createdAt: z.string(),
  rubric: rubricOutput,
})

const getAttemptOutputSchema = {
  id: z.uuid(),
  questionId: z.uuid(),
  response: z.string(),
  score: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
  createdAt: z.string(),
  question: questionOutput,
}

const getAttemptOutput = z.strictObject(getAttemptOutputSchema)

const config = {
  title: 'Get attempt',
  description:
    'Returns one immutable attempt belonging to the authenticated Skills Practice user, including its question and rubric.',
  inputSchema: showValidator.shape,
  outputSchema: getAttemptOutputSchema,
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
    const structuredContent = getAttemptOutput.parse(await getAttempt(ctx, input))

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

async function getAttempt(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(AttemptShowService)

  return service.execute(input)
}
