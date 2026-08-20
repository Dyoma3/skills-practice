import { z } from 'zod'

export const storeValidator = z.object({
  parentId: z.uuid().nullable().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
})

export const searchValidator = z.object({
  search: z.string().trim().min(1),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

export const showValidator = z.object({
  skillId: z.uuid(),
  includeChildren: z.boolean().optional(),
})

export const deleteValidator = z.object({
  skillId: z.uuid(),
})

export const updateValidator = z
  .object({
    skillId: z.uuid(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .refine(
    ({ name, description }) => name !== undefined || description !== undefined,
    'At least one field must be provided'
  )
