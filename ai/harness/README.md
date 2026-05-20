# ChinaTrip AI Harness

Phase 1 reserves the harness directory and defines the intent. The executable harness runner is Phase 2 work.

## Goal

The harness should verify whether AI answers follow ChinaTrip AI product rules:

- Correct language.
- Practical answer.
- China-specific context.
- No fabricated real-time policy, prices, or official links.
- Useful Chinese phrases when relevant.
- Not overly long or generic.

## First Cases

Initial cases should cover:

- Foreigners using Alipay or WeChat Pay.
- Apps to download before traveling to China.
- 3-day Beijing itinerary.
- Didi or taxi usage.
- Ordering food without speaking Chinese.
- High-speed rail for foreign tourists.

## Phase 2 Output

The runner should produce pass / fail results and highlight which checks failed.
