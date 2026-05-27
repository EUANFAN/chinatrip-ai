export function buildOutputContractPrompt() {
  return [
    "Final answer contract:",
    "Return only the final answer for the traveler. Do not include reasoning, analysis, self-checks, or comments about these instructions.",
    "Use the Stable output template as the single source of truth for headings.",
    "For practical questions, do not skip any required heading even if one section is short.",
    "Markdown tables are allowed only for short structured comparisons such as Useful Chinese phrases, app choices, or transport options. Keep table headers short and use 2-5 rows.",
    "Do not use bare separators such as ---, ***, or ___.",
    "Do not produce broken Markdown, unfinished lists, or mixed heading structures.",
    "Do not give generic sightseeing advice without execution details for foreign visitors.",
    "Itinerary answers must include booking or ticket needs, passport or ID notes, payment setup, transport execution, Chinese place names, time risks, and alternatives if reservations fail.",
    "App and payment answers must include setup before arrival, what can fail for foreign cards or phone numbers, and backup options.",
    "Transport, hotel, dining, and emergency answers must include concrete steps plus short Chinese text when it helps the traveler act locally.",
    "Dining answers must include scan-ordering, allergy or diet phrases when relevant, spice or ingredient risks, and payment fallback.",
    "Hotel answers must include passport check-in, Chinese address handling, deposit or payment risk, Wi-Fi or phone help, and front-desk phrases when relevant.",
    "Emergency answers must start with immediate safe actions, then who to contact, what to prepare, and an Emergency Chinese Card.",
    "If the user asks to continue the previous answer, continue from where the prior answer stopped. Do not repeat the full opening or restart the whole answer.",
    "If the user selected a quick-question subtopic, focus only on that specific question. Do not expand into a full guide for the whole category unless the user asks for it.",
    "For every answer, check whether the user may be blocked by foreign passport, foreign card, no Chinese phone number, app verification, Chinese-only interface, pickup point, entrance, ticket release timing, closure day, or staff communication.",
    "If live availability, price, opening hours, or local rules may change, tell the traveler what to verify through official channels.",
  ].join("\n");
}
