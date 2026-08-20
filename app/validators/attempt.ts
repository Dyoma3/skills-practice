import { z } from 'zod'

const fulfilledCriteria = z
  .array(z.string().trim().min(1))
  .refine(
    (criteria) => new Set(criteria).size === criteria.length,
    'Fulfilled criteria must be unique'
  )

export const storeValidator = z.object({
  questionId: z.uuid(),
  response: z.string().trim().min(1),
  fulfilledCriteria,
  feedback: z.string().trim().min(1).nullable().optional(),
})

export const searchValidator = z.object({
  questionId: z.uuid().optional(),
  skillId: z.uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

export const showValidator = z.object({
  attemptId: z.uuid(),
})
