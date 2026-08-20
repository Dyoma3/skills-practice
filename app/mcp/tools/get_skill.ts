import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import SkillShowService from '#services/skill/show'
import { showValidator } from '#validators/skill'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function getSkillTool(ctx: HttpContext): McpTool {
  return { name: 'get_skill', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const skillSchema = {
  id: z.uuid(),
  userId: z.number(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  description: z.string(),
}

const skillOutputSchema = {
  ...skillSchema,
  children: z.array(z.strictObject(skillSchema)).optional(),
}

const skillOutput = z.strictObject(skillOutputSchema)

const config = {
  title: 'Get skill',
  description:
    'Returns a skill that belongs to the authenticated Skills Practice user, optionally including its immediate children, equivalent to GET /skills/:id.',
  inputSchema: showValidator.shape,
  outputSchema: skillOutputSchema,
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
    const structuredContent = skillOutput.parse(await getSkill(ctx, input))

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

async function getSkill(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(SkillShowService)

  return service.execute(input)
}
