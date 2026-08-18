# Coding Patterns

## Contents

- Discovery
- Imports and Routes
- Controllers and Validation
- Models and Generated Schemas
- Transformers
- Services and MCP
- Authorization
- Queues

## Discovery

Inspect the local application before applying a pattern. In particular, verify:

- aliases and generated imports in `package.json` and `tsconfig.json`
- assembler hooks in `adonisrc.ts`
- providers and middleware registration
- the existing Zod parsing helper and error contract
- whether Lucid schema generation and `HttpContext.serialize` are enabled
- whether the queue package is BullMQ or `@adonisjs/queue`

## Imports and Routes

Prefer aliases and the v7 generated controller barrel:

```typescript
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('', [controllers.Resources, 'index'])
    router.post('', [controllers.Resources, 'store'])
    router.get(':id', [controllers.Resources, 'show'])
  })
  .prefix('resources')
  .use(middleware.auth())
```

Controller routes receive generated names such as `resources.index` and `resources.store`.
Use `.as()` only to preserve or define a deliberate public name. Prefer `urlFor`,
`response.redirect().toRoute()`, and named-route test requests over hard-coded URLs.

Generated files under `.adonisjs` support imports and type checking. Keep the repository's tracked
generated files in sync; do not hand-edit them.

## Controllers and Validation

Keep the happy path obvious. Parse external input through the repository's Zod helper, authorize,
query or delegate, and serialize the response.

```typescript
import Resource from '#models/resource'
import ResourcePolicy from '#policies/resource_policy'
import ResourceTransformer from '#transformers/resource_transformer'
import { storeValidator } from '#validators/resource'
import validateRequest from '#lib/request_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class ResourcesController {
  async store({ request, auth, bouncer, response, serialize }: HttpContext) {
    const data = validateRequest(storeValidator, request.all())
    await bouncer.with(ResourcePolicy).authorize('store')

    const resource = await Resource.create({ ...data, userId: auth.user!.id })
    response.status(201)
    return serialize(ResourceTransformer.transform(resource))
  }
}
```

The example assumes the local API provider adds `serialize` to `HttpContext`. If it does not,
follow the repository's response adapter while retaining the transformer as the public contract.

Define Zod validators under `app/validators` for request bodies, query strings, route params, and
transport payloads:

```typescript
import { z } from 'zod'

export const storeValidator = z.object({
  name: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(0),
})

export const updateValidator = storeValidator.partial()
```

- Keep internal service argument types and output schemas near their owner.
- Do not encode authorization or mutable-resource rules in validators.
- Do not claim generated request-body types unless the repository has wired its Zod schemas into
  that type-generation path.

## Models and Generated Schemas

When Lucid schema generation is enabled, define columns in migrations. Extend the generated schema
and keep relationships, hooks, computed properties, and domain behavior in the model:

```typescript
import User from '#models/user'
import { ResourcesSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Resource extends ResourcesSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
```

Use the actual generated export, whose name is derived from the table (for example,
`ResourcesSchema`). Never edit `database/schema.ts`; regenerate it through the configured
migration/entity workflow.
Use `database/schema_rules.ts` when the generated type mapping needs a project-wide override. If a
repository deliberately uses manual `BaseModel` columns, preserve that local setup.

## Transformers

Use a transformer when a model or workflow crosses a public API or Inertia boundary:

```typescript
import type Resource from '#models/resource'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ResourceTransformer extends BaseTransformer<Resource> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'quantity', 'createdAt'])
  }
}
```

Use transformer relationships, variants, and injected context for intentional alternate response
shapes. Preload every relationship a transformer reads. For internal-only data flow, plain models
or `model.serialize()` may remain appropriate; do not create transformers that add no boundary.

## Services and MCP

Use services for concrete workflows, not miscellaneous helpers. Keep reusable methods independent
of `ctx.response`:

```typescript
import Resource from '#models/resource'
import ResourceTransformer from '#transformers/resource_transformer'
import { indexValidator } from '#validators/resource'
import validateRequest from '#lib/request_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ResourceIndexService {
  constructor(private ctx: HttpContext) {}

  async httpExecute() {
    return this.ctx.serialize(
      ResourceTransformer.transform(
        await this.execute({
          filters: this.ctx.request.qs(),
          userId: this.ctx.auth.user!.id,
        })
      )
    )
  }

  async execute(input: { filters: unknown; userId: number }) {
    const { status } = validateRequest(indexValidator, input.filters)
    const query = Resource.query().where('userId', input.userId)

    if (status) query.where('status', status)
    return await query
  }
}
```

Keep MCP transport and tool registration under `app/mcp`. Tool callbacks should resolve and call
the same transport-neutral service method. Define strict Zod input and output schemas at the MCP
boundary so response drift fails tests instead of being silently stripped.

## Authorization

Use Bouncer policies for resource authorization:

```typescript
const resource = await Resource.findOrFail(params.id)
await bouncer.with(ResourcePolicy).authorize('show', resource)
```

Keep abilities in `app/abilities/main.ts`. When policy indexing is configured in `adonisrc.ts`, use
`#generated/policies` for registry consumers. Reuse established action names such as `show`,
`store`, `update`, and `delete`. Transformers may compute permission flags for clients that cannot
run server-side policies.

## Queues

For repositories using BullMQ, centralize queues in `lib/queues`, use typed payloads, configure
attempts/backoff/retention intentionally, and close queue connections during termination. Check the
worker consumer before changing a job name or payload.

If the repository already uses `@adonisjs/queue`, follow its typed `Job` classes and test fake.
Do not mix both queue abstractions in the same workflow.
