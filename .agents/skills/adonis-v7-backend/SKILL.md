---
name: adonis-v7-backend
description: "Use for all work in an AdonisJS v7 TypeScript backend: implementation, debugging, design, code review, architecture guidance, testing, routes, generated controllers, Lucid models and generated schemas, Zod validators, transformers, services, migrations, middleware, Bouncer authorization, BullMQ queues, MCP tools exposed through Adonis HTTP, and backend tests."
---

# Adonis v7 Backend

Use this skill as the generic AdonisJS v7 backend context while preserving the repository's local conventions.

## Start Here

Before editing, inspect `package.json`, `adonisrc.ts`, `tsconfig.json`, `start/kernel.ts`, and the
nearby feature. Confirm which Adonis providers, generated registries, validation helper, queue
package, and test setup the repository actually uses.

## Stack

- AdonisJS v7 and TypeScript
- PostgreSQL and Lucid ORM
- Zod for external input validation
- Redis and BullMQ where queues are used

## Core Rules

- Keep controllers thin: validate, resolve request context, authorize, and delegate substantial
  workflows to models or named services.
- Use Zod schemas in `app/validators` for external input contracts. Follow the repository's Zod
  parsing helper and error format. Do not replace Zod with Vine merely because Adonis documents it.
- Prefer Adonis path aliases, including `#generated/controllers`, `#generated/policies`,
  `#database/schema`, and `#transformers` when configured.
- Register controller routes with the generated controller barrel. Let controller routes use their
  generated names unless the public contract requires an explicit `.as()` name.
- Treat migrations as the database schema source. When Lucid schema generation is enabled, extend
  generated schema classes and never hand-edit `database/schema.ts`.
- Use transformers for intentional public API and Inertia response contracts. Check that the API
  provider adds `HttpContext.serialize` before using it.
- Put application workflows in named services only when they represent real domain composition or
  a large HTTP action. Do not use `app/services` as a helper bucket.
- Keep authorization in middleware, abilities, and Bouncer policies rather than ad hoc checks.
- Do not add broad controller `try/catch` blocks for normal Lucid or service failures. Let the
  global exception layer handle unexpected errors.
- For workflows shared by HTTP, MCP, jobs, or commands, separate the HTTP adapter from a
  transport-neutral method that accepts explicit input and returns plain data.
- Keep MCP definitions under `app/mcp` and reuse application services instead of controller logic.
- Preserve the repository's queue implementation. Use BullMQ patterns when BullMQ is installed;
  do not introduce `@adonisjs/queue` without an explicit request.
- Add or update tests for validation, behavior, response contracts, authorization, MCP contracts,
  and persistence changes. Prefer named-route requests and official database test utilities when
  the repository enables them.
- Run the repository's formatter, typecheck, and relevant tests after edits.

## Common Commands

Prefer scripts from `package.json`; common fallbacks are:

```bash
npm run dev
npm run test
npm run format
node ace migration:run
node ace make:migration <name>
node ace make:controller <name>
node ace make:transformer <name>
```

## References

Read only what the task needs:

- `references/patterns.md`: controllers, routes, generated schemas, Zod, transformers, services,
  MCP, Bouncer, and queues.
- `references/workflows.md`: endpoints, models, relationships, migrations, authorization,
  middleware, MCP, queues, jobs, and factories.
- `references/testing.md`: Japa, named routes, database isolation, factories, and MCP tests.
- `references/anti-patterns.md`: reviews, refactors, and broad implementation work.
