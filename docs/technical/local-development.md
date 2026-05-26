# ChinaTrip AI Local Development

## Current Phase

Current phase:

```text
MVP release candidate stabilization
```

Implemented core loop:

```text
Home question
→ Chat page
→ Streaming AI answer
→ Follow-up question
→ Copy or Share answer
→ Public share page
→ New user asks from share page
```

Current Phase 1 defaults:

- AI answers default to English through the chat/request `language`.
- Language switch UI is temporarily hidden; do not restore it unless the product plan changes.
- Save answer remains out of scope.
- Guest-to-user chat migration remains deferred.

## Requirements

```text
Node.js 22+
pnpm
Docker
PostgreSQL
Supabase project with Google Auth enabled
DeepSeek API key, or Doubao / Ark API key and endpoint id
```

## Install

```bash
pnpm install
```

## Environment

Create `.env.local` and provide the project values:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="..."
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"
AI_TEMPERATURE="0.2"
AI_MAX_OUTPUT_TOKENS="2000"

# Doubao is still supported by switching AI_PROVIDER to "doubao".
DOUBAO_API_KEY="..."
DOUBAO_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
DOUBAO_MODEL="ep-..."
```

When `AI_PROVIDER="deepseek"` and these two optional values are not set, the
server defaults to `AI_TEMPERATURE=0.2` and `AI_MAX_OUTPUT_TOKENS=2000` so
reasoning-capable models have enough budget for the final visible answer.

Production must set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain so metadata,
canonical URLs, robots, sitemap, and share links do not use localhost.

## Auth Configuration

Supabase Auth must enable Google as a provider.

Local redirect URL:

```text
http://localhost:3000/auth/callback
```

Production redirect URL:

```text
https://your-domain.com/auth/callback
```

Google OAuth consent screen should use the public product name `ChinaTrip AI`.

## Local PostgreSQL

Start PostgreSQL:

```bash
docker compose up -d
```

Stop PostgreSQL:

```bash
docker compose down
```

Remove local database volume:

```bash
docker compose down -v
```

## Prisma

Generate Prisma client:

```bash
pnpm prisma:generate
```

Validate schema:

```bash
pnpm exec prisma validate
```

Run migrations:

```bash
pnpm prisma:migrate
```

Before production deploy, confirm the migration that converts key timestamp
columns to `TIMESTAMPTZ(3)` has been applied to the production database.

## Development Server

```bash
pnpm dev
```

The app runs at:

```text
http://localhost:3000
```

## Verification

Run before release candidate handoff:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm exec prisma validate
pnpm run build
```

If `pnpm run build` fails in a sandbox with a Turbopack port binding error,
rerun it in a normal local shell.

## Common Issues

If Prisma cannot connect, check:

- Docker container or Supabase database is reachable.
- `.env.local` has the correct `DATABASE_URL`.
- Prisma migrations have been applied.

If Google login shows a Supabase project host instead of `ChinaTrip AI`, update
the Google OAuth consent screen app name and authorized domains.

If AI generation fails with `AI_QUOTA_EXHAUSTED`, the configured AI provider's
usage limit has been reached; the UI should show the dedicated usage exhausted
card.
