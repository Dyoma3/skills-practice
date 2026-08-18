import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const rubricDataSchema = vine
  .record(vine.number({ strict: true }).positive().withoutDecimals())
  .minLength(1)
  .validateKeys((criteria, field) => {
    if (criteria.some((criterion) => criterion.trim().length === 0)) {
      field.report('Criterion descriptors cannot be empty', 'emptyCriterion', field)
    }
  })

export const rubricDataValidator = vine.create(rubricDataSchema)

export type RubricData = Infer<typeof rubricDataSchema>
