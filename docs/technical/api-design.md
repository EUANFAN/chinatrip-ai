# ChinaTrip AI API Design

## API Routes

Phase 1 API surface:

```text
POST /api/chats
GET /api/chats
GET /api/chats/:chatId
POST /api/chats/:chatId/messages
POST /api/saved-answers
POST /api/shared-answers
GET /api/share/:shareId
```

## Error Shape

All API errors should use this shape:

```ts
type ApiError = {
  error: {
    code: string
    message: string
  }
}
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
- Cannot save answers.

Logged-in users:

- Identified through Supabase Auth.
- Can save answers.
- Can view their chat history.

Phase 1 does not require guest-to-user migration, but APIs should not block future migration.

## POST /api/chats

Creates a chat and the first user message.

Request:

```ts
type CreateChatRequest = {
  message: string
  language: 'en' | 'zh'
}
```

Response:

```ts
type CreateChatResponse = {
  chat: {
    id: string
    title: string
    language: 'en' | 'zh'
  }
  firstMessage: {
    id: string
    role: 'user'
    content: string
  }
}
```

## GET /api/chats

Returns chat history for the current user or anonymous session.

Response:

```ts
type ChatHistoryResponse = {
  chats: Array<{
    id: string
    title: string
    language: 'en' | 'zh'
    updatedAt: string
  }>
}
```

## GET /api/chats/:chatId

Returns one chat and its messages.

Response:

```ts
type ChatDetailResponse = {
  chat: {
    id: string
    title: string
    language: 'en' | 'zh'
  }
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}
```

## POST /api/chats/:chatId/messages

Writes a user message, calls AI Provider Service, writes the assistant message, and logs usage.

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
    role: 'user'
    content: string
  }
  assistantMessage: {
    id: string
    role: 'assistant'
    content: string
  }
}
```

## POST /api/saved-answers

Saves one question-answer pair. Requires login.

Request:

```ts
type SaveAnswerRequest = {
  chatId: string
  userMessageId: string
  assistantMessageId: string
}
```

Response:

```ts
type SaveAnswerResponse = {
  savedAnswerId: string
  status: 'saved'
}
```

## POST /api/shared-answers

Creates or returns a public share link for one question-answer pair.

Request:

```ts
type ShareAnswerRequest = {
  chatId: string
  userMessageId: string
  assistantMessageId: string
}
```

Response:

```ts
type ShareAnswerResponse = {
  shareId: string
  url: string
}
```

## GET /api/share/:shareId

Returns a public shared answer.

Response:

```ts
type SharedAnswerResponse = {
  question: string
  answer: string
  createdAt: string
}
```
