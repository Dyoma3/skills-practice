import { z } from 'zod'
import { RubricTypes } from '#types/index'

const rubricData = z
  .record(z.string().trim().min(1), z.number().int().positive())
  .refine((data) => Object.keys(data).length > 0, 'Rubric data must contain at least one criterion')

export const storeValidator = z.object({
  type: z.enum(RubricTypes),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  data: rubricData,
})

export const searchValidator = z.object({
  search: z.string().trim().min(1).optional(),
  type: z.enum(RubricTypes).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

export const showValidator = z.object({
  rubricId: z.uuid(),
})

export const deleteValidator = z.object({
  rubricId: z.uuid(),
})

export const updateValidator = z
  .object({
    rubricId: z.uuid(),
    type: z.enum(RubricTypes).optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .refine(
    ({ type, name, description }) =>
      type !== undefined || name !== undefined || description !== undefined,
    'At least one field must be provided'
  )
