import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import SkillSearchService from '#services/skill/search'
import { searchValidator } from '#validators/skill'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function searchSkillsTool(ctx: HttpContext): McpTool {
  return { name: 'search_skills', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const skillOutput = z.strictObject({
  id: z.uuid(),
  userId: z.number(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  description: z.string(),
})

const searchSkillsOutputSchema = {
  data: z.array(skillOutput),
  total: z.number(),
}

const searchSkillsOutput = z.strictObject(searchSkillsOutputSchema)

const config = {
  title: 'Search skills',
  description:
    'Searches skills belonging to the authenticated Skills Practice user by name or description.',
  inputSchema: searchValidator.shape,
  outputSchema: searchSkillsOutputSchema,
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
    const structuredContent = searchSkillsOutput.parse(await searchSkills(ctx, input))

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

async function searchSkills(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(SkillSearchService)

  return service.execute(input)
}
