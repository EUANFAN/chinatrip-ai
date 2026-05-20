# ChinaTrip UI Skill

## Applies To

- Home page.
- Chat page.
- Share page.
- Responsive layout.
- Sidebar and drawer.
- Chat messages and action buttons.

## Rules

- Build the actual product experience, not a marketing-only landing page.
- Keep the first screen focused on asking a China travel question.
- Use a modern, practical, international travel-tool feel.
- Avoid traditional travel agency styling.
- Use Tailwind responsive classes for desktop and mobile.
- Do not add decorative cards inside cards.
- Keep cards at 8px radius or less unless there is a strong local pattern.
- Use icons from `lucide-react` for tool buttons when useful.

## Chat Layout

Desktop:

- Sidebar open by default.
- Sidebar can close and reopen.
- Chat area expands when sidebar is closed.

Mobile:

- Sidebar hidden by default.
- Sidebar opens as a drawer.
- Drawer closes with close button, overlay, or history selection.
- Chat input remains usable at the bottom.

## Message UI

- User messages align right.
- Assistant messages align left.
- Assistant actions appear below the assistant answer.
- Save / Share / Copy must not overflow on narrow screens.
- Long chat lists should use `@tanstack/react-virtual`.

## Responsive QA

Check at minimum:

- 390px mobile width.
- 768px tablet width.
- 1440px desktop width.
