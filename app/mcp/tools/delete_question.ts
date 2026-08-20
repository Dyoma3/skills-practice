import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import QuestionDeleteService from '#services/question/delete'
import { deleteValidator } from '#validators/question'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function deleteQuestionTool(ctx: HttpContext): McpTool {
  return { name: 'delete_question', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const outputSchema = {
  id: z.uuid(),
}

const deleteQuestionOutput = z.strictObject(outputSchema)

const config = {
  title: 'Delete question',
  description:
    'Deletes a question belonging to the authenticated Skills Practice user. Questions with attempts cannot be deleted.',
  inputSchema: deleteValidator.shape,
  outputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
} satisfies McpTool['config']

// ### CALLBACK ###

function createCallback(ctx: HttpContext): McpTool['callback'] {
  return async (input) => {
    const structuredContent = deleteQuestionOutput.parse(await deleteQuestion(ctx, input))

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

async function deleteQuestion(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(QuestionDeleteService)

  return service.execute(input)
}
