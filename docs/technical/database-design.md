# ChinaTrip AI Database Design

## Strategy

Local development uses Docker PostgreSQL. Production uses Supabase PostgreSQL. Prisma is the data access and migration layer.

Phase 1 plans the schema and data contract. Migrations can be created when feature implementation begins.

## Tables

### profiles

Stores application profile information for Supabase Auth users.

```text
id
user_id
email
name
avatar_url
created_at
updated_at
```

### anonymous_sessions

Tracks anonymous browser sessions.

```text
id
anonymous_id
created_at
last_active_at
```

### chats

Stores chat sessions.

```text
id
user_id
anonymous_id
title
language
created_at
updated_at
```

Rules:

- `language` is `en` or `zh`.
- Title is generated from the first user question in Phase 1.
- A chat can belong to either `user_id` or `anonymous_id`.

### messages

Stores chat messages.

```text
id
chat_id
role
content
created_at
```

Rules:

- `role` is `user` or `assistant`.
- Messages are ordered by `created_at`.

### saved_answers

Stores one saved question-answer pair.

```text
id
user_id
chat_id
user_message_id
assistant_message_id
title
question
answer
created_at
```

Rules:

- Save requires login.
- MVP saves a single question-answer pair, not an entire chat.

### shared_answers

Stores a public shared question-answer pair.

```text
id
chat_id
user_message_id
assistant_message_id
share_slug
question
answer
is_public
created_at
```

Rules:

- Share does not require login in Phase 1.
- Only a single question-answer pair is shared.
- `share_slug` must be unique.

### ai_usage_logs

Stores AI request usage, cost, and fallback metadata.

```text
id
chat_id
message_id
provider
model
input_tokens
output_tokens
cost_estimate
latency_ms
success
fallback_used
error_message
created_at
```

Rules:

- Every AI request should create a usage log.
- Failed requests should also be logged when possible.
- Cost estimates are approximate and used for product decisions.

## Naming Rules

- Use snake_case for database columns.
- Use plural table names.
- Use `created_at` and `updated_at` where records are mutable.
- Preserve `anonymous_id` to enable future guest-to-user migration.
