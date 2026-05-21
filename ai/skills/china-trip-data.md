# ChinaTrip Data Skill

## Applies To

- Prisma schema.
- Database migrations.
- Seed data.
- Data ownership rules.

## Tables

Phase 1 planned tables:

```text
profiles
anonymous_sessions
chats
messages
shared_answers
ai_usage_logs
```

## Naming Rules

- Database tables use plural snake_case.
- Database columns use snake_case.
- TypeScript types use PascalCase.
- API response fields use camelCase.

## Migration Rules

- Use local Docker PostgreSQL for migration development.
- Do not run migrations directly against production during local development.
- Review generated Prisma migrations before applying to shared environments.

## Seed Rules

Seed data should support:

- At least one anonymous chat.
- At least one logged-in style profile placeholder.
- A mock payment Q&A.
- A mock shared answer.

## Data Ownership

- Anonymous chats belong to `anonymous_id`.
- Logged-in chats may belong to `user_id`.
- Share is public and does not require login in Phase 1.
- `saved_answers` is deferred until the product has a saved answers page or a clear save retrieval flow.
