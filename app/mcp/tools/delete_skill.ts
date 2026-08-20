import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import SkillDeleteService from '#services/skill/delete'
import { deleteValidator } from '#validators/skill'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function deleteSkillTool(ctx: HttpContext): McpTool {
  return { name: 'delete_skill', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const outputSchema = {
  id: z.uuid(),
}

const deleteSkillOutput = z.strictObject(outputSchema)

const config = {
  title: 'Delete skill',
  description:
    'Deletes an empty skill belonging to the authenticated Skills Practice user. Skills with children or questions cannot be deleted.',
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
    const structuredContent = deleteSkillOutput.parse(await deleteSkill(ctx, input))

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

async function deleteSkill(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(SkillDeleteService)

  return service.execute(input)
}
