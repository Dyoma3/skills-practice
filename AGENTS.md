# Skills Practice Backend

This repository is the AdonisJS v7 backend and MCP server for Skills Practice.

## Required Agent Context

Before working in this repository, read and follow the local Codex skill at
[`.agents/skills/adonis-v7-backend/SKILL.md`](.agents/skills/adonis-v7-backend/SKILL.md) for generic
backend conventions, architecture guidance, testing expectations, and code review criteria.

Treat the skill as mandatory repository context. Read its referenced files under
`.agents/skills/adonis-v7-backend/references/` as directed by the skill and as relevant to the task.

Also read [`.context/project.md`](.context/project.md) before making product, domain, persistence,
authentication, HTTP, or MCP changes. It is the shared, agent-optimized project context distilled
from [`README.md`](README.md) and the current architecture.

This repository exposes an MCP server through Adonis HTTP, so apply the skill's MCP guidance. It
does not use Redis, BullMQ, or `@adonisjs/queue`; skip the queue sections unless the repository
gains one of those dependencies.

## Context Priority

- Preserve `.context/project.md` and `README.md` as product intent; do not infer that an unimplemented
  invariant is optional.
- Follow nearby code, tests, and repository configuration for current framework mechanics.
- Prefer this repository's context over generic skill examples when they differ.
- Surface material conflicts between product intent and implementation instead of silently choosing
  one.

## Quality Bar

- Run `npm run format`, `npm run typecheck`, and the relevant Japa suites after edits.
- Add or update tests when domain behavior, validation, authorization, persistence, HTTP responses,
  or MCP contracts change.
- Check existing migrations, generated schemas, model relationships, and public contracts before
  changing the data model.
