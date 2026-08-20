import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import QuestionUpdateService from '#services/question/update'
import { updateValidator } from '#validators/question'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function updateQuestionTool(ctx: HttpContext): McpTool {
  return { name: 'update_question', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const updateQuestionOutputSchema = {
  id: z.uuid(),
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string(),
  context: z.string().nullable(),
  answer: z.string().nullable(),
  createdAt: z.string(),
}

const updateQuestionOutput = z.strictObject(updateQuestionOutputSchema)

const config = {
  title: 'Update question',
  description:
    'Updates the prompt, context, or reference answer of a question belonging to the authenticated Skills Practice user.',
  inputSchema: updateValidator.shape,
  outputSchema: updateQuestionOutputSchema,
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
    const structuredContent = updateQuestionOutput.parse(await updateQuestion(ctx, input))

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

async function updateQuestion(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(QuestionUpdateService)

  return service.execute(input)
}
