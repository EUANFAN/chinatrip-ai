# ChinaTrip AI MVP

## Product Basics

**Name:** ChinaTrip AI

**Headline:** Your AI Travel Guide for China

**Subtitle:** Ask practical questions about China travel, payments, transport, apps, food, and local tips. Get answers you can save and share.

ChinaTrip AI is a browser-based AI assistant for foreign travelers visiting China. It focuses on practical, travel-ready answers instead of traditional travel platform features such as maps, attraction databases, booking, or complex itinerary editing.

## MVP Goal

The MVP validates whether foreign travelers will use a dedicated AI assistant for China travel questions.

Primary validation points:

- Whether users ask their first China travel question.
- Whether AI answers feel clear, practical, and useful.
- Whether users continue asking follow-up questions.
- Whether users share answers with others.

Core loop:

```text
Home question
→ Chat page
→ AI answer
→ Follow-up question
→ Copy or Share answer
→ New user asks from share page
```

## Phase 1 Scope

Phase 1 prioritizes product function validation. Vibcoding is included as a project foundation, but only as lightweight directories and baseline skills.

Phase 1 includes:

- Independent Next.js project initialization.
- Home page.
- Classic question entry points.
- Chat detail page.
- AI answer generation.
- Follow-up questions.
- Chat history.
- New chat.
- Google login.
- User avatar and logout.
- Share answer.
- Copy answer.
- Share page.
- English default answers; Chinese language switch UI is temporarily hidden for launch.
- Responsive layout.
- AI usage logs.
- Docker PostgreSQL for local development.
- Prisma schema planning.
- Vibcoding directories.
- Baseline skills for UI, API, AI, data, and QA rules.

## Phase 2 Scope

Phase 2 improves the Vibcoding system after the Phase 1 product loop is working.

Phase 2 includes:

- Full harness runner.
- More fixtures.
- Expected answer checks.
- Prompt versioning.
- Model comparison reports.
- AI answer quality reports.
- Skills refined from real development experience.

## Out of Scope for Phase 1

Phase 1 does not include:

- Guest 3-question limit.
- Logged-in user 5-question limit.
- Credits.
- Payment or recharge.
- Upgrade page.
- Save answer.
- Saved answers page.
- Saved answer management.
- RAG.
- pgvector.
- Maps.
- Attraction detail pages.
- Complex itinerary editor.
- Image recognition.
- Voice input.
- PDF export.
- Native client app.
- Complex agents.
- Full multi-model evaluation platform.

## Pages

The MVP has three core pages:

```text
/
Home

/chat/:chatId
Chat detail

/share/:shareId
Public share page
```

The MVP does not ship separate pages for saved answers, pricing, or account management.

Release candidate notes:

- AI answers default to English. The language switch entry is intentionally hidden until the language experience is finalized.
- Save answer remains out of scope; Copy and Share are the supported answer actions.
- Logged-in users can create and view profile-owned chats, but anonymous chat migration after login is deferred.

## Home Page Requirements

The home page must include:

- Logo / product name.
- English UI by default. The language switch is temporarily hidden.
- Google login entry.
- Hero visual direction.
- Headline.
- Subtitle.
- Question input.
- Ask AI button.
- Classic questions.
- Footer.

Submit behavior:

- Empty input cannot submit.
- Enter submits.
- Shift + Enter inserts a new line.
- Submitting creates a chat and the first user message.
- Successful creation navigates to `/chat/:chatId`.
- The chat page generates the first AI answer.

## Chat Page Requirements

The chat page includes:

- Sidebar.
- New Chat.
- Chat History.
- User Area.
- Chat Header.
- Message List.
- Chat Input.
- Share / Copy.

Sidebar behavior:

- Desktop sidebar is open by default.
- Desktop sidebar can be closed and reopened.
- When closed on desktop, the chat area fills the width.
- Mobile sidebar is hidden by default.
- Mobile sidebar opens as a drawer.
- Mobile drawer can close via close button or overlay.
- Selecting a history item on mobile closes the drawer.

Message behavior:

- User messages align right.
- AI messages align left.
- AI messages show Share / Copy actions.
- AI generation shows a loading state.
- Long conversations use a virtualized message list.

AI answer style:

- Direct answer.
- Practical steps when useful.
- Things to watch out for.
- Useful Chinese phrases when useful.
- Quick summary when useful.

## Share Page Requirements

The share page shows a single question-answer pair, not an entire chat.

It includes:

- Header.
- Original Question.
- AI Answer.
- Created Date.
- Ask your own question CTA.
- Question input.
- Footer.

Submitting a question from the share page creates a new chat and navigates to `/chat/:chatId`.

## Responsive Requirements

Home:

- Desktop: centered Hero, wide input, classic questions wrap horizontally.
- Mobile: single column, full-width input, classic questions stacked vertically.

Chat:

- Desktop: sidebar open by default, closable, chat area expands.
- Mobile: sidebar hidden by default, opens as a drawer.

Share:

- Desktop: centered readable content width.
- Mobile: single column, question and answer prioritized.
