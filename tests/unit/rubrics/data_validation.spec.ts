import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import { RubricFactory } from '#database/factories/rubric_factory'

test.group('Rubric data validation hook', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('derives the maximum score when a rubric is created', async ({ assert }) => {
    const rubric = await RubricFactory.merge({
      name: 'Initial score derivation',
      data: {
        'first criterion': 2,
        'second criterion': 3,
      },
    }).create()

    assert.equal(rubric.maxScore, 5)
  })

  test('tracks and persists a criterion added to data in place', async ({ assert }) => {
    const rubric = await RubricFactory.merge({
      name: 'Nested data mutation',
      data: { 'existing criterion': 1 },
    }).create()

    rubric.data['new criterion'] = 2

    assert.deepEqual(rubric.$dirty.data, {
      'existing criterion': 1,
      'new criterion': 2,
    })

    await rubric.save()
    await rubric.refresh()

    assert.deepEqual(rubric.data, {
      'existing criterion': 1,
      'new criterion': 2,
    })
    assert.equal(rubric.maxScore, 3)
  })

  test('rejects invalid points added to data in place', async ({ assert }) => {
    const rubric = await RubricFactory.merge({
      name: 'Nested data validation',
      data: { 'valid criterion': 1 },
    }).create()

    rubric.data['invalid criterion'] = 0

    assert.property(rubric.$dirty, 'data')
    await assert.rejects(() => rubric.save(), errors.E_VALIDATION_ERROR)
  })
})
