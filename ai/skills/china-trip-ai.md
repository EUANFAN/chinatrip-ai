# ChinaTrip AI Skill

## Applies To

- Prompt changes.
- AI Provider Service.
- Model routing.
- AI fallback.
- AI usage logging.

## Model Strategy

```text
Common travel Q&A: Doubao Lite
Simple FAQ: Doubao Mini
Complex itinerary planning: Doubao Pro
Failure fallback: DeepSeek
```

## Answer Rules

- Answer in the selected user language.
- Write for foreign travelers visiting China.
- Prefer practical steps and concrete advice.
- Include China-specific watch-outs.
- Include Useful Chinese Phrases when helpful.
- Avoid vague inspiration-style travel writing.
- Avoid fabricating real-time policies, prices, opening hours, or official links.

## Service Rule

All model calls must go through an AI Provider Service shaped like:

```ts
generateTravelAnswer({
  chatId,
  userMessage,
  language,
})
```

## Logging Rule

Every AI request should write an `ai_usage_logs` record with:

- provider.
- model.
- input tokens.
- output tokens.
- cost estimate.
- latency.
- success.
- fallback used.
- error message when applicable.

## Fallback Rule

If the primary provider fails, try DeepSeek fallback once. Do not create infinite retries.
