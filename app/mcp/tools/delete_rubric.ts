import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import RubricDeleteService from '#services/rubric/delete'
import { deleteValidator } from '#validators/rubric'
import type { McpTool } from '../types.js'

// ### TOOL ###

export function deleteRubricTool(ctx: HttpContext): McpTool {
  return { name: 'delete_rubric', config, callback: createCallback(ctx) }
}

// ### CONFIG ###

const outputSchema = {
  id: z.uuid(),
}

const deleteRubricOutput = z.strictObject(outputSchema)

const config = {
  title: 'Delete rubric',
  description:
    'Deletes an unreferenced rubric from the shared Skills Practice catalog. Rubrics referenced by questions cannot be deleted.',
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
    const structuredContent = deleteRubricOutput.parse(await deleteRubric(ctx, input))

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

async function deleteRubric(ctx: HttpContext, input: unknown) {
  const service = await ctx.containerResolver.make(RubricDeleteService)

  return service.execute(input)
}
