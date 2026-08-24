import { z } from 'zod'

const postgresIntegerMax = 2_147_483_647

export const questionDifficultySchema = z
  .number()
  .int()
  .positive()
  .max(postgresIntegerMax)
  .describe(
    'Relative difficulty within this skill. Use a coarse scale: most skills should fit within levels 1–10, and simple easy/medium/hard progressions may use 1/2/3. Higher values are harder. Values above 10 are allowed when the established history or the user requires additional progression. Avoid unnecessary granularity and calibrate against existing questions and attempts.'
  )

export const storeValidator = z.object({
  skillId: z.uuid(),
  rubricId: z.uuid(),
  difficulty: questionDifficultySchema,
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

export const updateValidator = z
  .object({
    questionId: z.uuid(),
    difficulty: questionDifficultySchema.optional(),
    prompt: z.string().trim().min(1).optional(),
    context: z.string().trim().min(1).nullable().optional(),
    answer: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    ({ difficulty, prompt, context, answer }) =>
      difficulty !== undefined ||
      prompt !== undefined ||
      context !== undefined ||
      answer !== undefined,
    'At least one field must be provided'
  )
