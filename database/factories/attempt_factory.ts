import factory from '@adonisjs/lucid/factories'
import Attempt from '#models/attempt'

export const AttemptFactory = factory
  .define(Attempt, async ({ faker }) => {
    return {
      response: faker.lorem.paragraph(),
      score: 0,
      feedback: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    }
  })
  .build()
