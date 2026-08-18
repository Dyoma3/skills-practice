# Skills Practice Backend

This repository is the AdonisJS v7 backend and MCP server for Skills Practice.

## Shared Backend Skill

For all work in this AdonisJS backend, read and follow the local Codex skill at
[`.agents/skills/adonis-v7-backend/SKILL.md`](.agents/skills/adonis-v7-backend/SKILL.md) for generic
backend conventions, architecture guidance, testing expectations, and code review criteria.

Treat this skill as part of the repository context. Read the skill's referenced files under
`.agents/skills/adonis-v7-backend/references/` as directed by the skill and as relevant to the task.

This repository exposes an MCP server through Adonis HTTP, so apply the skill's MCP guidance. It
does not use Redis, BullMQ, or `@adonisjs/queue`; skip the queue sections unless the repository
gains one of those dependencies.

## Skills Practice Context

- Read [`README.md`](README.md) for the product model, domain invariants, and current non-goals.
- Preserve the immutable-attempt, stable-rubric, leaf-question, and acyclic-skill-tree invariants.
- Keep OAuth-protected MCP behavior consistent with the HTTP authentication and ownership model.
- Use Zod and `lib/request_validator.ts` for application input contracts. Preserve Vine where the
  Adonis framework bootstrap or an existing feature already requires it.
- Keep generated controllers, route registries, Lucid schemas, transformers, and API serialization
  aligned with the hooks and provider configured in this repository.
- Never hand-edit generated files under `.adonisjs/` or `database/schema.ts`.

## Quality Bar

- Run `npm run format`, `npm run typecheck`, and the relevant Japa suites after edits.
- Add or update tests when domain behavior, validation, authorization, persistence, HTTP responses,
  or MCP contracts change.
- Check existing migrations, generated schemas, model relationships, and public contracts before
  changing the data model.
