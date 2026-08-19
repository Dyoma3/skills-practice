# Skills Practice Project Context

Use this file as the repository-specific overlay for the generic AdonisJS backend skill. Inspect
the nearby code and tests before editing: this file captures product intent and non-negotiable
constraints, while the implementation shows the current state and may still have gaps.

## Mission

Skills Practice is a persistent deliberate-practice backend and MCP server for authenticated AI
agents. It replaces disconnected practice chats with queryable data that can answer what was
practiced, whether performance is improving, and where reasoning repeatedly fails.

Optimize for durable and comparable learning history. Do not turn the product into a generic LMS,
content generator, or chat transcript store.

## Domain Model

- A `Skill` is a node in a self-referencing tree. Root skills have no parent; intermediate skills
  organize decomposition; leaf skills are the independently trainable units.
- A `Question` is a reusable exercise owned by exactly one leaf skill and evaluated by one rubric.
  If the same prompt trains two skills, create two questions rather than sharing ownership.
- A `Rubric` is a reusable catalog entry. Criteria describe observable evidence and map that
  evidence to points so evaluation is mechanical and repeatable.
- An `Attempt` is an append-only practice event containing the response, rubric-derived score, and
  immediate feedback. Repeated attempts are reinforcement, not duplicate questions.

Relationship summary:

```text
Skill(parent) -> Skill(children)
Skill(leaf)   -> Question
Rubric        -> Question
Question      -> Attempt
```

## Non-Negotiable Invariants

- Prevent cycles in the skill tree.
- Allow questions only on leaf skills.
- Derive a rubric's maximum score from its criterion points.
- Score attempts by marking fulfilled criteria and summing their points; do not assign a holistic
  score by judgment.
- Once attempts use a rubric, do not mutate its scoring data. Create a new rubric instead so
  historical scores remain comparable.
- Never update attempts in place. Corrections and reinforcement create new attempts.
- Derive first exposure versus reinforcement from earlier attempts for the same question; do not
  store redundant mutable state.
- Keep every authenticated user's practice data isolated. Never assume access to another user's
  records. If the current schema does not encode ownership for a feature, treat that as a gap to
  resolve or surface, not permission to expose global data.

These are product rules, even where the current code has not implemented all enforcement yet. Add
validation, transactions, constraints, and tests at the appropriate boundary rather than silently
weakening an invariant.

## HTTP, MCP, and Authentication

- The MCP server is exposed over Streamable HTTP at `/mcp` and protected by OAuth 2.0 authorization
  code flow with PKCE.
- MCP access tokens are intentionally separate from regular API access tokens. Preserve the MCP
  resource metadata, authorization-server metadata, scopes, token audience, expiry, and redirect
  URI protections.
- Treat MCP as an adapter over the same application workflows used by HTTP. Put tool definitions
  under `app/mcp`, keep substantial domain behavior in transport-neutral services or models, and do
  not call controller methods from MCP tools.
- Define strict MCP input and output schemas and test protocol results independently from HTTP
  responses.
- Keep web-session authentication for the human authorization flow distinct from MCP bearer-token
  authentication.

## Repository Conventions

- Use AdonisJS v7, TypeScript, PostgreSQL, and Lucid ORM.
- Treat migrations as the schema source. Models extend generated classes from `#database/schema`;
  never hand-edit `database/schema.ts` or `.adonisjs/` output.
- Register routes through `#generated/controllers` and preserve deliberate public route names.
- Use Zod schemas in `app/validators` with `lib/request_validator.ts` for external transport input.
  Preserve Vine for the existing internal rubric-data schema and framework bootstrap; do not
  rewrite either validation path incidentally.
- Use transformers and the API provider's `HttpContext.serialize` for intentional public response
  contracts. The configured serializer wraps serialized responses under `data`.
- Keep controllers thin. Reuse explicit application workflows across HTTP and MCP rather than
  duplicating business rules.
- Use Japa's `unit`, `functional`, and `mcp` suites. Prefer generated route names where the route
  registry supports them and isolate database state per test.
- The repository has no Redis, BullMQ, or `@adonisjs/queue`. Do not introduce queue infrastructure
  without an explicit requirement.

## Current Non-Goals

Do not add these without an explicit product decision:

- rubric versioning
- shared scenarios as a first-class entity
- error-tag taxonomies
- scheduling or automatic next-exercise selection
- explicit ordering between sibling skills
- specialized tree-storage structures for the expected shallow trees

A global score scale is still undecided. Do not implement skill-level score rollups until a shared
scale makes scores across rubrics semantically comparable.

## Decision Rules

- For product semantics, preserve this context and `README.md`; do not mistake an implementation
  gap for a deliberate product rule.
- For framework mechanics, follow the current configuration, nearby code, and tests before the
  generic skill's examples.
- If product intent, tests, and implementation disagree materially, call out the mismatch and make
  the requested behavior explicit in tests.
- Preserve HTTP, MCP, authentication, persistence, and generated-client contracts together when a
  change crosses those boundaries.

## Quality Checks

Run the narrowest relevant checks first, then the repository-level checks appropriate to the
change:

```bash
npm test
npm run typecheck
npm run lint
npm run format
npm run build
```
