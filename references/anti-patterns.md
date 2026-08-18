# Anti-Patterns

## Framework and Generated Code

- Do not treat all Adonis v7 repositories as identical; inspect providers, hooks, aliases, and
  installed packages first.
- Do not hand-edit `database/schema.ts`, `#generated/controllers`, `#generated/policies`, or files
  under `.adonisjs` that are owned by generators.
- Do not keep manual controller lazy-import declarations when the repository uses
  `#generated/controllers`.
- Do not assume `ctx.serialize` exists without the API provider.
- Do not hard-code route URLs when a generated route name serves the same purpose.

## Validation and Contracts

- Do not replace Zod with Vine. Validation-library choice is a project convention, not a reason to
  rewrite code during a framework task.
- Do not treat `app/validators` as a bucket for internal service types or response schemas.
- Do not hide authorization or mutable-resource rules inside Zod refinements.
- Do not promise inferred generated request bodies when the Zod contract is not integrated with
  the route registry.
- Do not expose Lucid models directly when a stable public response requires a transformer.
- Do not create DTOs or transformers that merely copy an internal model without defining a useful
  boundary.

## Controllers, Models, and Services

- Do not put multi-model orchestration or heavy transformations in controllers.
- Do not add broad `try/catch` blocks around ordinary ORM and service calls.
- Do not inject `HttpContext` into transport-neutral domain services.
- Do not call `ctx.response` from methods reused by MCP, jobs, or commands.
- Do not put generated column declarations in a model that extends a generated schema class.
- Do not read unloaded relationships from a transformer.
- Do not move unrelated helpers into `app/services` merely to shorten a file.

## Authorization, MCP, and Queues

- Do not repeat ownership checks when a Bouncer policy should own them.
- Do not put MCP implementations in the handler or under `app/services`.
- Do not use loose MCP output schemas that silently strip response drift.
- Do not change job names or payloads without updating their consumers.
- Do not introduce `@adonisjs/queue` into a BullMQ application, or vice versa, without an explicit
  queue migration task.

## Tests and Refactors

- Do not share mutable database fixtures across tests without deliberate isolation.
- Do not assert implementation details when route, response, persistence, or protocol behavior is
  the contract.
- Do not silently change route names, transformer output, validation errors, or job payloads during
  a refactor.
