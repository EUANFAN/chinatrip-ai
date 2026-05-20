# ChinaTrip QA Skill

## Applies To

- Manual acceptance.
- Fixtures.
- Future harness runner.
- Regression checks.

## Manual Acceptance Checklist

- Home page can submit a question.
- Classic question can create a chat.
- Chat page can show an AI answer.
- Chat page can send a follow-up.
- Desktop sidebar opens, closes, and reopens.
- Mobile sidebar opens as a drawer and closes.
- Save prompts login when logged out.
- Logged-in user can save an answer.
- Share creates a public link.
- Share page displays one question-answer pair.
- Copy writes answer content to clipboard.
- Language switch affects UI and AI answer language.

## Fixtures Rules

- Keep classic questions in `ai/fixtures/classic-questions.json`.
- Keep mock chat examples in `ai/fixtures/mock-chats.json`.
- Add a fixture whenever a new AI behavior becomes product-critical.

## Harness Phase 2 Goals

The harness should verify:

- Correct language.
- Practical steps.
- China-specific travel context.
- No fabricated real-time data.
- Useful Chinese phrases where relevant.
- Reasonable answer length.

## Regression Rule

When changing prompts or model routing, rerun the relevant harness cases once the runner exists.
