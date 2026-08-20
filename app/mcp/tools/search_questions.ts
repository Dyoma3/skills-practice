import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import QuestionSearchService from '#services/question/search'
import { searchValidator } from '#validators/question'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function searchQuestionsTool(ctx: HttpContext): McpTool {
  return { name: 'search_questions', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const questionOutput = z.strictObject({
  id: z.uuid(),
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string(),
  context: z.string().nullable(),
  answer: z.string().nullable(),
  createdAt: z.string(),
})

const searchQuestionsOutputSchema = {
  data: z.array(questionOutput),
  total: z.number(),
}

const searchQuestionsOutput = z.strictObject(searchQuestionsOutputSchema)

const config = {
  title: 'Search questions',
  description:
    "Searches the authenticated Skills Practice user's questions by optional prompt or context text and exact skill, with pagination.",
  inputSchema: searchValidator.shape,
  outputSchema: searchQuestionsOutputSchema,
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
    const structuredContent = searchQuestionsOutput.parse(await searchQuestions(ctx, input))

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

async function searchQuestions(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(QuestionSearchService)

  return service.execute(input)
}
