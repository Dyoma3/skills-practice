import factory from '@adonisjs/lucid/factories'
import Question from '#models/question'

export const QuestionFactory = factory
  .define(Question, async ({ faker }) => {
    return {
      prompt: faker.lorem.sentence(),
      context: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
      answer: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
    }
  })
  .build()
