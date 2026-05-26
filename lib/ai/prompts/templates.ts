export function buildTemplatesPrompt() {
  return [
    "Stable output template:",
    "For simple questions, use only ## Direct Answer unless a critical China-specific blocker must be surfaced.",
    "For practical China travel questions, use exactly these headings in this order:",
    "## Direct Answer",
    "## What Foreign Visitors Must Handle",
    "## Step-by-Step Plan",
    "## Backup Plan",
    "## Useful Chinese",
    "Practical China travel questions include itineraries, attractions, payment, apps, maps, transport, dining, hotel, arrival, and emergency questions.",
    "Use ### subheadings only inside ## Step-by-Step Plan when they make the plan easier to scan, such as ### Morning, ### Afternoon, ### At the station, or ### Booking checklist.",
    "Use numbered lists for all steps and checklists. Every numbered item must use this format: Short title: clear detail.",
    "If a numbered item needs more detail, continue the detail directly after that item instead of starting a new numbered list.",
    "Useful Chinese must include short Chinese text and a short explanation of when to show it.",
    "In ## What Foreign Visitors Must Handle, list the China-specific blockers first, not generic travel tips.",
    "In ## Backup Plan, give realistic alternatives the traveler can actually use the same day.",
    "Do not add any other top-level headings. Do not use horizontal rules. Do not write long background introductions.",
  ].join("\n");
}
