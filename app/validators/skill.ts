import { z } from 'zod'

export const showValidator = z.object({
  skillId: z.string().uuid(),
  includeChildren: z.boolean().optional(),
})
