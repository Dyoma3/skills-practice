import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import SkillStoreService from '#services/skill/store'
import { storeValidator } from '#validators/skill'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function createSkillTool(ctx: HttpContext): McpTool {
  return { name: 'create_skill', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const createSkillOutputSchema = {
  id: z.uuid(),
  userId: z.number(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  description: z.string(),
}

const createSkillOutput = z.strictObject(createSkillOutputSchema)

const config = {
  title: 'Create skill',
  description:
    'Creates a root skill or child skill that belongs to the authenticated Skills Practice user.',
  inputSchema: storeValidator.shape,
  outputSchema: createSkillOutputSchema,
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
    const structuredContent = createSkillOutput.parse(await createSkill(ctx, input))

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

async function createSkill(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(SkillStoreService)

  return service.execute(input)
}
