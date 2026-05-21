# ChinaTrip AI API Design

## Common Rules

MVP APIs support the core product loop:

```text
Home question
→ Chat page
→ AI answer
→ Follow-up question
→ Copy or Share answer
→ New user asks from share page
```

Rules:

- Base path is `/api`.
- Request and response bodies use JSON.
- API response fields use camelCase.
- Database fields use snake_case and are mapped in the server layer.
- Copy answer is client-side only through the Browser Clipboard API.
- MVP does not expose Save answer APIs.
- Share does not require login in Phase 1.

## Error Shape

All API errors use this shape:

```ts
type ApiError = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

Common error codes:

```text
EMPTY_MESSAGE
INVALID_LANGUAGE
CHAT_NOT_FOUND
MESSAGE_NOT_FOUND
PAIR_NOT_FOUND
SHARE_NOT_FOUND
SHARE_NOT_PUBLIC
UNAUTHORIZED
FORBIDDEN
AI_GENERATION_FAILED
RATE_LIMITED
INTERNAL_ERROR
```

Example:

```json
{
  "error": {
    "code": "EMPTY_MESSAGE",
    "message": "Please enter your question."
  }
}
```

## Identity Rules

Anonymous users:

- Use an `anonymous_id` cookie.
- Can create chats and messages.
- Can share answers.
- Can open public share pages.

Logged-in users:

- Are identified through Supabase Auth.
- Have a row in `profiles`.
- Can view their chat history.
- Can share answers.

Identity resolution:

- If a Supabase session exists, get or create `profiles`.
- If no Supabase session exists, get or create `anonymous_sessions`.
- If no `anonymous_id` cookie exists, generate one and set it.
- Phase 1 does not require guest-to-user migration, but APIs should preserve anonymous ownership fields so migration remains possible.

Cookie recommendation:

```text
name: anonymous_id
httpOnly: true
sameSite: lax
secure: true in production
maxAge: 365 days
```

## API Routes

Phase 1 API surface:

```text
POST /api/chats
GET /api/chats
GET /api/chats/:chatId
PATCH /api/chats/:chatId
POST /api/chats/:chatId/messages
POST /api/shared-answers
GET /api/share/:shareId
POST /api/share/:shareId/chats
GET /api/me
POST /api/auth/logout
```

`PATCH /api/chats/:chatId` is a designed endpoint for title/status updates and does not need to be implemented in the first API batch.

## Chat APIs

### POST /api/chats

Creates a chat and the first user message. This is used by the home page and by the share page question input.

AI answer generation is not performed by this endpoint. After successful creation, the client navigates to `/chat/:chatId`; the chat page then calls the message endpoint to generate an assistant answer.

Request:

```ts
type CreateChatRequest = {
  message: string
  language?: 'en' | 'zh'
  source?: 'home' | 'share'
  shareId?: string
}
```

Parameters:

- `message`: First user question. Required after trim.
- `language`: UI/answer language. Defaults to `en`.
- `source`: Optional analytics source. Use `home` or `share`.
- `shareId`: Optional source share id when the user asks from a share page.

Response:

```ts
type CreateChatResponse = {
  chat: {
    id: string
    title: string
    language: 'en' | 'zh'
    status: 'active'
    createdAt: string
    updatedAt: string
    lastMessageAt: string
  }
  firstMessage: {
    id: string
    chatId: string
    role: 'user'
    status: 'complete'
    sequence: number
    content: string
    createdAt: string
  }
}
```

Database behavior:

- Resolve `profiles` or `anonymous_sessions`.
- Create `chats`.
- Create first `messages` row with `role=user`, `status=complete`, `sequence=1`.
- Set `chats.last_message_at`.

Errors:

- `EMPTY_MESSAGE`
- `INVALID_LANGUAGE`
- `INTERNAL_ERROR`

### GET /api/chats

Returns chat history for the current logged-in profile or anonymous session.

Query:

```ts
type ChatHistoryQuery = {
  limit?: number
  cursor?: string
}
```

Parameters:

- `limit`: Defaults to `30`, maximum `50`.
- `cursor`: Pagination cursor from the previous response.

Response:

```ts
type ChatHistoryResponse = {
  chats: Array<{
    id: string
    title: string
    language: 'en' | 'zh'
    status: 'active' | 'archived'
    updatedAt: string
    lastMessageAt: string
    preview: string | null
  }>
  nextCursor: string | null
}
```

Rules:

- Do not return `deleted` chats.
- Sort by `lastMessageAt desc`.
- `preview` is a short summary of the latest visible message.

Errors:

- `INTERNAL_ERROR`

### GET /api/chats/:chatId

Returns one chat and its messages for the current owner.

Response:

```ts
type ChatDetailResponse = {
  chat: {
    id: string
    title: string
    language: 'en' | 'zh'
    status: 'active' | 'archived'
    createdAt: string
    updatedAt: string
    lastMessageAt: string
  }
  messages: Array<{
    id: string
    chatId: string
    role: 'user' | 'assistant'
    status: 'pending' | 'complete' | 'failed'
    sequence: number
    content: string
    errorCode: string | null
    errorMessage: string | null
    createdAt: string
    updatedAt: string
  }>
}
```

Rules:

- Only the owning profile or anonymous session can read the chat.
- Messages are returned by `sequence asc`.
- MVP does not return `system` messages to the client.

Errors:

- `CHAT_NOT_FOUND`
- `FORBIDDEN`
- `INTERNAL_ERROR`

### PATCH /api/chats/:chatId

Updates chat metadata. This is a designed endpoint for later MVP polish and is not required in the first API implementation batch.

Request:

```ts
type UpdateChatRequest = {
  title?: string
  status?: 'active' | 'archived' | 'deleted'
}
```

Response:

```ts
type UpdateChatResponse = {
  chat: {
    id: string
    title: string
    status: 'active' | 'archived' | 'deleted'
    updatedAt: string
  }
}
```

Rules:

- Only the owning profile or anonymous session can update the chat.
- `deleted` is a soft delete.

Errors:

- `CHAT_NOT_FOUND`
- `FORBIDDEN`
- `INTERNAL_ERROR`

### POST /api/chats/:chatId/messages

Sends a follow-up message, generates an AI answer, writes both messages, and logs AI usage.

The same endpoint can generate the first assistant answer after `POST /api/chats` if the chat currently ends with a user message and no assistant answer has been written for that turn.

Request:

```ts
type SendMessageRequest = {
  message: string
}
```

Response:

```ts
type SendMessageResponse = {
  userMessage: {
    id: string
    chatId: string
    role: 'user'
    status: 'complete'
    sequence: number
    content: string
    createdAt: string
  }
  assistantMessage: {
    id: string
    chatId: string
    role: 'assistant'
    status: 'complete' | 'failed'
    sequence: number
    content: string
    errorCode: string | null
    errorMessage: string | null
    createdAt: string
    updatedAt: string
  }
  usage: {
    provider: 'mock' | 'doubao' | 'deepseek'
    model: string
    promptVersion: string
    inputTokens: number | null
    outputTokens: number | null
    latencyMs: number | null
    fallbackUsed: boolean
  }
}
```

Database behavior:

- Validate chat ownership.
- Create a user message with the next sequence number.
- Create an assistant message with `status=pending`.
- Call AI Provider Service.
- Update assistant message to `complete` or `failed`.
- Create an `ai_usage_logs` row.
- Update `chats.updated_at` and `chats.last_message_at`.

Failure behavior:

- AI failures should still create/update an assistant message with `status=failed`.
- AI failures should still write `ai_usage_logs.success=false` when possible.
- Client can show the assistant `errorMessage`.

Errors:

- `EMPTY_MESSAGE`
- `CHAT_NOT_FOUND`
- `FORBIDDEN`
- `AI_GENERATION_FAILED`
- `INTERNAL_ERROR`

## Share APIs

### POST /api/shared-answers

Creates or reuses a public share record for one question-answer pair.

Share does not require login in Phase 1.

Request:

```ts
type CreateSharedAnswerRequest = {
  chatId: string
  userMessageId: string
  assistantMessageId: string
}
```

Parameters:

- `chatId`: Chat containing the pair.
- `userMessageId`: User question message.
- `assistantMessageId`: Complete assistant answer message.

Response:

```ts
type CreateSharedAnswerResponse = {
  share: {
    id: string
    shareId: string
    url: string
    question: string
    answer: string
    createdAt: string
  }
}
```

Database behavior:

- Validate chat ownership.
- Validate `userMessageId` belongs to the chat and has `role=user`.
- Validate `assistantMessageId` belongs to the chat, has `role=assistant`, and has `status=complete`.
- Validate the two messages form a valid question-answer pair.
- Reuse an existing public share for the same assistant message when possible.
- Otherwise create `shared_answers` with question and answer snapshots.

Rules:

- `shareId` maps to database `share_slug`.
- The share page reads snapshots from `shared_answers`.
- Full chat history is never exposed by this endpoint.

Errors:

- `CHAT_NOT_FOUND`
- `MESSAGE_NOT_FOUND`
- `PAIR_NOT_FOUND`
- `FORBIDDEN`
- `INTERNAL_ERROR`

### GET /api/share/:shareId

Returns a public shared question-answer snapshot.

This endpoint does not require login.

Response:

```ts
type SharedAnswerResponse = {
  share: {
    id: string
    shareId: string
    question: string
    answer: string
    createdAt: string
    viewCount: number
  }
}
```

Rules:

- Return only shares where `is_public=true` and `revoked_at=null`.
- Do not return `chatId`, message ids, `profileId`, or `anonymousSessionId`.
- Increment `view_count` synchronously or asynchronously.

Errors:

- `SHARE_NOT_FOUND`
- `SHARE_NOT_PUBLIC`
- `INTERNAL_ERROR`

### POST /api/share/:shareId/chats

Creates a new chat from the share page question input.

This endpoint is semantically equivalent to `POST /api/chats`, but preserves share conversion context.

Request:

```ts
type CreateChatFromShareRequest = {
  message: string
  language?: 'en' | 'zh'
}
```

Response:

```ts
type CreateChatFromShareResponse = CreateChatResponse
```

Rules:

- Internally reuse the same service logic as `POST /api/chats`.
- Treat source as `share`.
- Attach `shareId` to analytics metadata when available.
- Client navigates to `/chat/:chatId` after success.

Errors:

- `EMPTY_MESSAGE`
- `INVALID_LANGUAGE`
- `SHARE_NOT_FOUND`
- `INTERNAL_ERROR`

## Profile and Auth APIs

### GET /api/me

Returns current identity state for header, sidebar, and client initialization.

Response:

```ts
type MeResponse = {
  user: {
    id: string
    email: string | null
    name: string | null
    avatarUrl: string | null
    locale: 'en' | 'zh'
  } | null
  anonymous: {
    id: string
  }
}
```

Rules:

- Always ensure an anonymous cookie exists.
- `user` is `null` when the visitor is logged out.
- Logged-in users still keep the anonymous id for future migration support.

Errors:

- `INTERNAL_ERROR`

### POST /api/auth/logout

Logs out the current Supabase session.

Response:

```ts
type LogoutResponse = {
  status: 'ok'
}
```

Rules:

- Clear the Supabase session.
- Do not delete the `anonymous_id` cookie.

Errors:

- `INTERNAL_ERROR`

## AI Internal Service Contract

There is no public `/api/ai` endpoint in MVP. AI generation is called internally by `POST /api/chats/:chatId/messages`.

Input:

```ts
type GenerateAnswerInput = {
  chatId: string
  language: 'en' | 'zh'
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}
```

Output:

```ts
type GenerateAnswerResult = {
  content: string
  provider: 'mock' | 'doubao' | 'deepseek'
  model: string
  promptVersion: string
  inputTokens: number | null
  outputTokens: number | null
  costEstimate: string | null
  latencyMs: number
  fallbackUsed: boolean
  metadata?: Record<string, unknown>
}
```

Rules:

- First API implementation may use `provider=mock`.
- Doubao is the target primary provider.
- DeepSeek is the planned fallback provider.
- Every generation attempt should create an `ai_usage_logs` row when possible.

## Endpoint Priority

Implementation order:

```text
1. POST /api/chats
2. GET /api/chats/:chatId
3. POST /api/chats/:chatId/messages
4. GET /api/chats
5. POST /api/shared-answers
6. GET /api/share/:shareId
7. POST /api/share/:shareId/chats
8. GET /api/me
9. PATCH /api/chats/:chatId
10. POST /api/auth/logout
```

## Test Plan

Home flow:

- Empty message returns `EMPTY_MESSAGE`.
- Valid message creates a chat and first user message.
- Missing anonymous cookie is created.

Chat flow:

- Current owner can fetch chat detail.
- Another anonymous session cannot fetch the chat.
- Follow-up creates a user message, assistant message, and usage log.
- AI failure writes a failed assistant message and usage log when possible.

History flow:

- `GET /api/chats` returns only current identity chats.
- Pagination works with `limit` and `cursor`.

Share flow:

- Anonymous user can share a complete assistant answer.
- Sharing the same answer twice reuses the existing public share.
- Public share fetch returns only the question-answer snapshot.
- Private or revoked shares are not publicly readable.

Copy flow:

- No backend endpoint exists for Copy.
- Copy uses the Browser Clipboard API.

Save flow:

- No `POST /api/saved-answers` endpoint exists in MVP.
