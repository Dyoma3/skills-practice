import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import SkillUpdateService from '#services/skill/update'
import { updateValidator } from '#validators/skill'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function updateSkillTool(ctx: HttpContext): McpTool {
  return { name: 'update_skill', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const updateSkillOutputSchema = {
  id: z.uuid(),
  userId: z.number(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  description: z.string(),
}

const updateSkillOutput = z.strictObject(updateSkillOutputSchema)

const config = {
  title: 'Update skill',
  description:
    'Updates the name or description of a skill belonging to the authenticated Skills Practice user.',
  inputSchema: updateValidator.shape,
  outputSchema: updateSkillOutputSchema,
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
    const structuredContent = updateSkillOutput.parse(await updateSkill(ctx, input))

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

async function updateSkill(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(SkillUpdateService)

  return service.execute(input)
}
