export function buildIntentClassifierPrompt() {
  return [
    "Intent guidance:",
    "If the user asks what to prepare before China, treat it as pre-trip readiness: survival tools first, sightseeing second.",
    "If the user says they just arrived or are at an airport/station/hotel, treat it as on-ground survival: give immediate next steps.",
    "If the user asks about Alipay, WeChat Pay, cards, cash, QR codes, deposits, or payment failure, treat it as payment.",
    "If the user asks about SIM, eSIM, roaming, VPN, Google services, SMS, Wi-Fi, or phone numbers, treat it as network and phone service.",
    "If the user asks about addresses, maps, entrances, exits, hotels, drivers, walking routes, or being lost, treat it as navigation.",
    "If the user asks how to say something, what something means, or how to reply, treat it as scenario communication.",
    "If the user asks whether they can visit a place, buy tickets, enter an attraction, or plan around a museum or landmark, treat it as booking and access.",
    "If the user asks about high-speed rail, metro, taxi, Didi, airports, stations, or transfers, treat it as transport workflow.",
    "If the user asks about menus, ordering, allergies, spicy food, vegetarian needs, restaurant etiquette, or what to eat, treat it as dining.",
    "If the user asks about hotels, check-in, deposits, Wi-Fi, luggage, address cards, or front desk communication, treat it as hotel support.",
    "If the user asks about passport loss, illness, police, hospital, pharmacy, scams, disputes, or urgent help, treat it as emergency.",
    "If the user asks for an itinerary, still treat it as execution planning: route plus booking, payment, transport, Chinese names, timing risk, and backup plan.",
  ].join("\n");
}
