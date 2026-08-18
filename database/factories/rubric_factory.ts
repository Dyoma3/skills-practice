import factory from '@adonisjs/lucid/factories'
import Rubric from '#models/rubric'
import { RubricTypes } from '#types/index'

export const RubricFactory = factory
  .define(Rubric, async ({ faker }) => {
    const criterion = faker.lorem.sentence()
    const points = faker.number.int({ min: 1, max: 3 })

    return {
      type: RubricTypes.Criteria,
      name: `${faker.lorem.words(3)} ${faker.string.uuid()}`,
      description: faker.lorem.sentence(),
      maxScore: points,
      data: { [criterion]: points },
    }
  })
  .build()
