# ChinaTrip API Skill

## Applies To

- Next.js Route Handlers.
- Chat creation.
- Message sending.
- Share answer.
- Public share fetch.

## Rules

- Keep model API keys on the server only.
- Validate request payloads with Zod when implementing endpoints.
- Use one consistent error shape:

```ts
{
  error: {
    code: string
    message: string
  }
}
```

- Do not return raw provider errors to the client.
- Use `anonymous_id` cookie for logged-out chat ownership.
- Use Supabase Auth user identity for logged-in chat history behavior.
- Share does not require login in Phase 1.
- Copy is client-side only and does not call the backend.

## Route Scope

Phase 1 routes:

```text
POST /api/chats
GET /api/chats
GET /api/chats/:chatId
POST /api/chats/:chatId/messages
POST /api/chats/:chatId/messages/stream
POST /api/shared-answers
GET /api/share/:shareId
```

## API Design Rule

Keep responses stable and client-friendly. React Query should be able to cache them with predictable query keys.
