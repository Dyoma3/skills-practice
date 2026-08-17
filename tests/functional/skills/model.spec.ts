import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Skill from '#models/skill'

test.group('Skill model', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('creates roots and navigates the self-referential tree', async ({ assert }) => {
    const root = await Skill.create({
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    const child = await Skill.create({
      parentId: root.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    })

    await root.refresh()
    await child.load('parent')
    await root.load('children')

    assert.match(root.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    assert.isNull(root.parentId)
    assert.equal(child.parent?.id, root.id)
    assert.deepEqual(
      root.children.map((skill) => skill.id),
      [child.id]
    )
  })

  test('rejects duplicate root names', async ({ assert }) => {
    const attributes = {
      name: 'System design',
      description: 'Design reliable distributed systems',
    }

    await Skill.create(attributes)

    await assert.rejects(() => Skill.create(attributes), /skills_parent_id_name_unique/)
  })

  test('rejects duplicate names under the same parent', async ({ assert }) => {
    const parent = await Skill.create({
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    const attributes = {
      parentId: parent.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    }

    await Skill.create(attributes)

    await assert.rejects(() => Skill.create(attributes), /skills_parent_id_name_unique/)
  })

  test('allows the same name under different parents', async ({ assert }) => {
    const firstParent = await Skill.create({
      name: 'Backend engineering',
      description: 'Build backend services',
    })
    const secondParent = await Skill.create({
      name: 'Frontend engineering',
      description: 'Build frontend applications',
    })

    const firstChild = await Skill.create({
      parentId: firstParent.id,
      name: 'Performance',
      description: 'Improve backend performance',
    })
    const secondChild = await Skill.create({
      parentId: secondParent.id,
      name: 'Performance',
      description: 'Improve frontend performance',
    })

    assert.notEqual(firstChild.id, secondChild.id)
  })

  test('does not delete a skill that still has children', async ({ assert }) => {
    const parent = await Skill.create({
      name: 'System design',
      description: 'Design reliable distributed systems',
    })
    await Skill.create({
      parentId: parent.id,
      name: 'Capacity estimation',
      description: 'Estimate traffic, storage, and bandwidth',
    })

    await assert.rejects(() => parent.delete(), /skills_parent_id_foreign/)
  })
})
