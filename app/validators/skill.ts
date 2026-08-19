import { z } from 'zod'

export const storeValidator = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
})

export const searchValidator = z.object({
  search: z.string().trim().min(1),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

export const showValidator = z.object({
  skillId: z.string().uuid(),
  includeChildren: z.boolean().optional(),
})
