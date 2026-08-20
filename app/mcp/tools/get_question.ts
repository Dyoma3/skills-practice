import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import QuestionShowService from '#services/question/show'
import { showValidator } from '#validators/question'
import { RubricTypes } from '#types/index'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function getQuestionTool(ctx: HttpContext): McpTool {
  return { name: 'get_question', config, callback: createCallback(ctx) }
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

const getQuestionOutputSchema = {
  id: z.uuid(),
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string(),
  context: z.string().nullable(),
  answer: z.string().nullable(),
  createdAt: z.string(),
  rubric: rubricOutput,
}

const getQuestionOutput = z.strictObject(getQuestionOutputSchema)

const config = {
  title: 'Get question',
  description:
    'Returns a question belonging to the authenticated Skills Practice user together with its complete scoring rubric.',
  inputSchema: showValidator.shape,
  outputSchema: getQuestionOutputSchema,
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
    const structuredContent = getQuestionOutput.parse(await getQuestion(ctx, input))

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

async function getQuestion(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(QuestionShowService)

  return service.execute(input)
}
