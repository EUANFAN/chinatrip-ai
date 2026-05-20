# ChinaTrip AI Local Development

## Current Phase

Current phase:

```text
Project initialization + documentation baseline
```

Not implemented yet:

- Business pages.
- Real API routes.
- Google login integration.
- Prisma migration.
- Real AI calls.

## Requirements

```text
Node.js 22+
pnpm
Docker
```

## Install

```bash
pnpm install
```

## Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Default local database URL:

```env
DATABASE_URL="postgresql://chinatrip:chinatrip@localhost:5432/chinatrip_dev"
```

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

Run migration later when schema implementation begins:

```bash
pnpm prisma:migrate
```

Phase 1 documentation baseline does not require running migrations.

## Development Server

```bash
pnpm dev
```

The app runs at:

```text
http://localhost:3000
```

## Common Issues

If port 5432 is already used, change the host port in `docker-compose.yml`.

If Prisma cannot connect, check:

- Docker container is running.
- `.env.local` has the correct `DATABASE_URL`.
- The database name is `chinatrip_dev`.
