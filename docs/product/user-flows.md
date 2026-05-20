# ChinaTrip AI User Flows

## Home Question Flow

```text
User opens home page
→ User types a question or clicks a classic question
→ App validates non-empty input
→ App gets or creates anonymous_id
→ API creates chat
→ API writes first user message
→ UI navigates to /chat/:chatId
→ Chat page requests AI answer
→ API writes assistant message
→ UI shows answer
→ API writes ai_usage_logs
```

## Follow-Up Flow

```text
User types follow-up question
→ App validates non-empty input
→ API writes user message
→ AI Provider Service generates answer
→ API writes assistant message
→ React Query refreshes chat
→ UI updates message list
→ API writes ai_usage_logs
```

## Save Answer Flow

```text
User clicks Save below an AI message
→ App checks current user
→ If not logged in, open Google login prompt
→ If logged in, API saves question + answer
→ Button changes to Saved
→ Toast shows Saved
```

Save scope:

```text
One question + one AI answer
```

The MVP does not save or share full chat transcripts.

## Share Answer Flow

```text
User clicks Share below an AI message
→ API checks whether a share record already exists
→ If missing, API creates shared_answer
→ API returns /share/:shareId
→ UI copies link to clipboard
→ Toast shows Share link copied
```

Share does not require login in Phase 1.

## Copy Answer Flow

```text
User clicks Copy below an AI message
→ Browser Clipboard API copies current AI answer
→ Toast shows Copied
```

Copy does not require login and does not call the backend.

## Share Page Conversion Flow

```text
Visitor opens /share/:shareId
→ Page shows Original Question and AI Answer
→ Visitor enters a new question
→ API creates new chat
→ UI navigates to /chat/:chatId
→ AI generates a new answer
```

## Google Login Trigger Flow

Google login can be triggered by:

- Header login button.
- Sidebar user area.
- Clicking Save while logged out.

Login success behavior:

```text
User returns to current page
→ Header / Sidebar show avatar
→ User can save answers
```

Phase 1 does not require guest-to-user chat migration, but the data model should allow future migration by preserving `anonymous_id`.
