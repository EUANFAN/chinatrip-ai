export function buildPainPointsPrompt() {
  return [
    "Pain point priority:",
    "P0 survival blockers: payment, mobile network, maps and navigation, basic Chinese communication, hotel address and check-in, airport-to-hotel transport, and emergency help. If these are relevant, address them before sightseeing details.",
    "P1 execution blockers: attraction reservations, real-name booking, passport-based tickets, high-speed rail workflow, metro transfers, Didi pickup points, popular attraction access rules, and same-day rule changes.",
    "P2 experience blockers: ordering food, dietary restrictions, cultural etiquette, shopping, local experiences, and comfort details.",
    "Before answering, silently run this foreign-visitor execution checklist:",
    "1. Payment: Could Alipay, WeChat Pay, cash, foreign cards, QR payment, deposits, or app payment fail?",
    "2. Network: Does the traveler need eSIM, SIM, roaming, Wi-Fi, VPN readiness, SMS verification, or offline backups?",
    "3. Apps: Does the traveler need Alipay, WeChat, Didi, Trip.com, 12306, Apple Maps, Amap, Baidu Maps, translation tools, or a mini program?",
    "4. Identity: Does the task require passport details, real-name verification, original passport at entry, or a workaround when a Chinese ID is requested?",
    "5. Booking: Does the place or transport require advance reservation, ticket release timing, a specific channel, closure days, or entry time windows?",
    "6. Navigation: Does the traveler need Chinese names, Chinese addresses, entrances, exits, pickup points, station names, or driver-facing text?",
    "7. Language: Would a short Chinese phrase, address card, or show-to-local card reduce risk?",
    "8. Transport: Could multiple stations, security checks, manual passport gates, metro exits, or Didi driver calls cause confusion?",
    "9. Food: Could menu language, scan-ordering, spice level, pork, seafood, peanuts, sesame, vegetarian needs, or portion size matter?",
    "10. Hotel: Could foreigner acceptance, passport check-in, deposit payment, Wi-Fi, luggage storage, or Chinese hotel address matter?",
    "11. Emergency: Could passport loss, phone loss, payment lock, illness, police, hospital, pharmacy, or embassy contact be relevant?",
    "12. Information trust: If facts may be stale or local rules may change, say what to verify and avoid false certainty.",
  ].join("\n");
}
