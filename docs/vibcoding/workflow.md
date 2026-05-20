# ChinaTrip AI Vibcoding Workflow

## Positioning

Vibcoding is part of the ChinaTrip AI project, but Phase 1 prioritizes product function validation. The project must reserve the right directories and write baseline skills now. Full harness automation and prompt version management are Phase 2 work.

## Phase 1 Strategy

Phase 1 means:

```text
Function validation first
Vibcoding directories reserved
Baseline skills written
Fixtures and prompts seeded lightly
Harness runner deferred
```

Phase 1 must include:

- `docs/product`
- `docs/technical`
- `docs/vibcoding`
- `ai/prompts`
- `ai/fixtures`
- `ai/harness`
- `ai/skills`

## Phase 1 Workflow

For every meaningful feature:

```text
1. Check product docs.
2. Check technical docs.
3. Check relevant skill.
4. Implement the smallest functional slice.
5. Update docs if behavior changes.
6. Add or update fixture if AI behavior changes.
```

## Phase 2 Workflow

Phase 2 adds:

- Harness runner.
- Expected answer checks.
- Prompt versioning.
- AI answer quality reports.
- Model comparison reports.
- Skills refined from actual implementation.

## Rules

- Do not treat skills as decorative docs. Use them before implementation.
- Do not let implementation drift from product scope.
- Do not build RAG, credits, or payment in Phase 1.
- Do not expose model API keys to client components.
- Do not claim real-time policy or price accuracy unless backed by a verified source.

## Directory Purposes

```text
docs/product
Product scope, copywriting, user flows.

docs/technical
Stack, API, database, local development.

docs/vibcoding
Development workflow and AI collaboration rules.

ai/prompts
System prompt and answer style constraints.

ai/fixtures
Classic questions and mock chat examples.

ai/harness
Future AI behavior checks.

ai/skills
Project-level implementation rules.
```
