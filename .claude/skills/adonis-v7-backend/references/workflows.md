# Workflows

## Contents

- Create an API Endpoint
- Add a Migration and Model
- Add a Model Relationship
- Add a Transformer
- Add Authorization
- Add Custom Middleware
- Add MCP Reuse
- Add or Change a Background Job
- Add a Queue
- Add a Factory

## Create an API Endpoint

1. Inspect a nearby feature and confirm its Zod helper, response envelope, authorization, and route
   naming conventions.
2. Add the Zod external-input schema under `app/validators`.
3. Add the controller method. Keep it thin and use a transformer for an intentional public shape.
4. Register the route with `#generated/controllers` and the required middleware.
5. Add a policy action when the resource is scoped.
6. Add functional tests through the generated route name.
7. Run formatting, typechecking, and the focused tests.

## Add a Migration and Model

1. Create the migration with `node ace make:migration <name>`.
2. Define columns, indexes, foreign keys, and delete/update behavior in the migration.
3. Run the migration through the repository's normal workflow.
4. When schema generation is enabled, import the generated class from `#database/schema` and
   extend it in the model. Never edit `database/schema.ts`.
5. Add relationships, hooks, computed values, and domain methods to the model.
6. Add or update factories and persistence tests.

Example model:

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

## Add a Model Relationship

1. Add the foreign key or pivot table through a migration, including indexes and deliberate
   update/delete behavior.
2. Run the migration so generated schema classes include the new columns.
3. Add Lucid relationship decorators and relation types to both model sides; do not edit the
   generated schema classes.
4. Preload relationships before a transformer reads them and use nested transformers at public
   boundaries.
5. Update factories and test querying, persistence, and serialization.

## Add a Transformer

1. Run `node ace make:transformer <name>`.
2. Define the public fields in `toObject()`.
3. Represent preloaded relationships with nested transformers.
4. Add variants only for genuinely different public views.
5. Confirm `providers/api_provider.ts` exposes `HttpContext.serialize` before calling it.
6. Test the exact public response shape and generated client types used by the repository.

## Add Authorization

1. Load the resource through the scope expected by the application.
2. Reuse an existing Bouncer policy and action name where possible.
3. Call `bouncer.with(Policy).authorize(action, resource)` before mutation or disclosure.
4. Ensure the configured `indexPolicies()` hook is enabled when registry consumers require it; let
   the generator index the policy.
5. Test allowed, denied, and unauthenticated cases.

## Add Custom Middleware

1. Generate it with `node ace make:middleware <name>` and implement a narrow `handle(ctx, next)`
   responsibility.
2. Register global/server middleware or named route middleware in `start/kernel.ts`, matching the
   intended lifecycle.
3. Apply named middleware to the relevant route or group without duplicating policy logic.
4. Confirm ordering when it depends on auth, bindings, sessions, or another middleware.
5. Test pass-through and rejection behavior through functional requests.

## Add MCP Reuse

1. Extract or extend a service with `execute(input)` returning plain application data.
2. Keep the HTTP adapter separate and let it own `HttpContext` response handling.
3. Create the MCP tool under `app/mcp/tools` with strict Zod input and output schemas.
4. Resolve the service from the request-scoped container and call `execute(input)`.
5. Register the tool in the existing MCP handler.
6. Test the HTTP behavior and MCP protocol result independently.

## Add or Change a Background Job

1. Inspect `package.json` and existing queue code; preserve BullMQ or `@adonisjs/queue` as found.
2. Define a minimal, versionable, typed payload using stable identifiers rather than model objects.
3. Configure retry, backoff, deduplication, and retention based on operation semantics.
4. Make the handler idempotent when retries can repeat side effects.
5. Update both producer and consumer together.
6. Test dispatch and failure behavior with the queue package's existing test pattern.

## Add a Queue

1. Inspect the installed queue package and existing connection/config conventions.
2. For BullMQ, define the queue under `lib/queues`, reuse the Redis config, centralize its name, and
   close its connection with the application termination hook.
3. For an existing `@adonisjs/queue` setup, use its configured driver and create typed jobs with
   `node ace make:job <name>`.
4. Keep worker registration and processing separate from HTTP controllers.
5. Set retry, backoff, retention, concurrency, and deduplication deliberately.
6. Add a dispatch test and a focused processor test; do not require a live worker for controller
   tests.

## Add a Factory

1. Generate it with `node ace make:factory <Model>`.
2. Define valid defaults for model-owned fields and use `.merge()` for scenario-specific values.
3. Define factory relationships that mirror the Lucid model relationships.
4. Use `.with()`, `.create()`, and `.createMany()` to build only the graph each test needs.
5. Keep seed-only volume or randomness out of assertions and preserve per-test database isolation.
