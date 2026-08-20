import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import QuestionStoreService from '#services/question/store'
import { storeValidator } from '#validators/question'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function createQuestionTool(ctx: HttpContext): McpTool {
  return { name: 'create_question', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const createQuestionOutputSchema = {
  id: z.uuid(),
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string(),
  context: z.string().nullable(),
  answer: z.string().nullable(),
  createdAt: z.string(),
}

const createQuestionOutput = z.strictObject(createQuestionOutputSchema)

const config = {
  title: 'Create question',
  description:
    'Creates a reusable practice question under a leaf skill belonging to the authenticated Skills Practice user, using a rubric from the shared catalog.',
  inputSchema: storeValidator.shape,
  outputSchema: createQuestionOutputSchema,
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
    const structuredContent = createQuestionOutput.parse(await createQuestion(ctx, input))

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

async function createQuestion(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(QuestionStoreService)

  return service.execute(input)
}
