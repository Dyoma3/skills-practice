import { z } from 'zod'

export const storeValidator = z.object({
  skillId: z.uuid(),
  rubricId: z.uuid(),
  prompt: z.string().trim().min(1),
  context: z.string().trim().min(1).nullable().optional(),
  answer: z.string().trim().min(1).nullable().optional(),
})

export const searchValidator = z.object({
  search: z.string().trim().min(1).optional(),
  skillId: z.uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

export const showValidator = z.object({
  questionId: z.uuid(),
})

export const deleteValidator = z.object({
  questionId: z.uuid(),
})
