# ChinaTrip AI Technical Stack

## Recommended Stack

```text
Next.js
React
TypeScript
Tailwind CSS
Supabase Auth
Docker PostgreSQL
Supabase PostgreSQL
Prisma
React Query
useState / Zustand
@tanstack/react-virtual
Doubao LLM
DeepSeek fallback
Vercel
```

## Stack Mapping

| Module | Technology | Reason / Scenario |
|---|---|---|
| Web app | Next.js | Home, chat, share page, API Route Handlers |
| UI | React | Inputs, message stream, modal, toast, sidebar |
| Types | TypeScript | Chat, Message, SavedAnswer, SharedAnswer contracts |
| Styling | Tailwind CSS | Fast responsive UI implementation |
| Auth | Supabase Auth | Google login, logout, current user |
| Local DB | Docker PostgreSQL | Local development and migration validation |
| Production DB | Supabase PostgreSQL | Production persistence |
| ORM | Prisma | Schema, migrations, seed, server queries |
| Server state | React Query | Chat, messages, history, save, share requests |
| UI state | useState / Zustand | Input, toast, language, sidebar, modal |
| Virtual list | @tanstack/react-virtual | Long chat message performance |
| AI service | AI Provider Service | Doubao, DeepSeek, fallback, logging |
| Deployment | Vercel | Next.js production hosting |

## Selection Notes

### Next.js + React + TypeScript

Next.js supports the page structure and server-side API needs of the MVP. React handles interactive chat UI. TypeScript keeps core product objects explicit and easier to refactor.

### Tailwind CSS

Tailwind is used for a fast, controlled, responsive implementation. Do not introduce a heavy UI framework during Phase 1 unless a concrete need appears.

### Supabase Auth

Supabase Auth handles Google OAuth and session management. The project should not self-implement JWT auth in Phase 1.

### PostgreSQL + Prisma

PostgreSQL stores chats, messages, saved answers, shared answers, and AI usage logs. Prisma provides type-safe server-side access and migration management.

Local development uses Docker PostgreSQL. Production uses Supabase PostgreSQL.

### React Query

React Query owns server state: chat history, current chat, save state, share link creation, and loading / error states.

### Zustand / useState

Use `useState` for local component state. Use Zustand when multiple components share UI state such as login modal, toast, language, or sidebar state.

### @tanstack/react-virtual

Use for chat messages once the list can grow. Messages have dynamic height, so the implementation must support measuring variable-size rows.

### Doubao + DeepSeek

Doubao is the primary provider for China travel scenarios. DeepSeek is the fallback provider and later evaluation baseline.

Default model strategy:

```text
Common travel Q&A: Doubao Lite
Simple FAQ: Doubao Mini
Complex itinerary planning: Doubao Pro
Failure fallback: DeepSeek
```
