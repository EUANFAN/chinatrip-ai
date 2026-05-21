# ChinaTrip AI Database Design

## Strategy

Local development uses Docker PostgreSQL. Production uses Supabase PostgreSQL.
Prisma is the data access and migration layer.

The MVP database supports the core product loop:

```text
Home question
→ Chat page
→ AI answer
→ Follow-up question
→ Copy or Share answer
→ New user asks from share page
```

MVP keeps the schema focused on chat ownership, messages, public sharing, and
AI usage logging. `Save answer` / bookmarks are deferred because the MVP does
not ship a saved answers page or saved answer management.

## Tables

### profiles

Stores business profile information for Supabase Auth users. The application
does not self-implement passwords or auth tokens.

```text
id
user_id
email
name
avatar_url
locale
created_at
updated_at
```

Rules:

- `user_id` stores the Supabase Auth user id and must be unique.
- `email` may be nullable, but should be unique when present.
- `locale` defaults to `en` in MVP.
- Future user preferences can be added here without changing chat ownership.

### anonymous_sessions

Tracks anonymous browser sessions for logged-out users.

```text
id
anonymous_id
user_agent
created_at
last_active_at
```

Rules:

- `anonymous_id` is stored in a browser cookie and must be unique.
- Anonymous users can create chats, send messages, copy answers, and share answers.
- Anonymous records are preserved to support future guest-to-user migration.

### chats

Stores chat sessions.

```text
id
profile_id
anonymous_session_id
title
language
status
created_at
updated_at
last_message_at
```

Rules:

- `language` is `en` or `zh`.
- `status` is `active`, `archived`, or `deleted`.
- A chat should have either `profile_id` or `anonymous_session_id` when created.
- After a guest logs in, a chat may keep `anonymous_session_id` and also receive `profile_id`.
- `title` is generated from the first user question in MVP.
- Chat history is sorted by `last_message_at desc`.

### messages

Stores chat messages.

```text
id
chat_id
role
status
sequence
content
error_code
error_message
metadata
created_at
updated_at
```

Rules:

- `role` is `user`, `assistant`, or `system`; MVP UI uses `user` and `assistant`.
- `status` is `pending`, `complete`, or `failed`.
- `sequence` is the stable display order within a chat.
- Messages are displayed by `sequence asc`, then `created_at asc`.
- AI generation may create a `pending` assistant message and update it to `complete`.
- `metadata` stores provider parameters, prompt references, or debug context.

### shared_answers

Stores a public shareable snapshot of one question-answer pair.

```text
id
chat_id
user_message_id
assistant_message_id
profile_id
anonymous_session_id
share_slug
question
answer
is_public
view_count
created_at
updated_at
revoked_at
```

Rules:

- Share does not require login in Phase 1.
- `profile_id` is nullable for anonymous sharing.
- `anonymous_session_id` is nullable for logged-in sharing.
- `share_slug` must be unique and is the public URL identifier.
- The share page reads only `question` and `answer` snapshots, not the full chat.
- Reuse an existing share record for the same assistant message when possible.
- `revoked_at` supports future share cancellation; MVP may not expose this UI.

### ai_usage_logs

Stores AI request usage, cost, fallback, and failure metadata.

```text
id
chat_id
message_id
provider
model
prompt_version
input_tokens
output_tokens
cost_estimate
latency_ms
success
fallback_used
error_message
metadata
created_at
```

Rules:

- `provider` is `mock`, `doubao`, or `deepseek`.
- `message_id` usually points to the assistant message and may be nullable for failed requests.
- Successful and failed AI requests should both be logged when possible.
- `cost_estimate` is approximate and used for product decisions.
- `metadata` can store request ids, model parameters, and fallback details.

## Deferred Tables

### saved_answers

`saved_answers` is not part of the MVP schema.

Rationale:

- The MVP does not ship a saved answers page.
- Save does not create a public link.
- Save does not create an image or export.
- Without a retrieval surface, Save is weaker than Share and Copy.

Add `saved_answers` later only when the product includes saved answer retrieval
or management. A future table should store a `profile_id`, original message ids,
and a question-answer snapshot.

## Indexes

Recommended indexes:

```text
profiles.user_id unique
profiles.email unique where not null
anonymous_sessions.anonymous_id unique
chats.profile_id + last_message_at
chats.anonymous_session_id + last_message_at
messages.chat_id + sequence unique
shared_answers.share_slug unique
shared_answers.assistant_message_id
ai_usage_logs.chat_id + created_at
ai_usage_logs.message_id
```

## Naming Rules

- Database tables use plural snake_case.
- Database columns use snake_case.
- TypeScript types use PascalCase.
- API response fields use camelCase.
- Preserve `anonymous_id` to enable future guest-to-user migration.
