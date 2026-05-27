import type { AnswerVisuals } from "@/lib/api/types";
import { findAnswerAssets } from "./registry";
import type { PromptProfile } from "@/lib/quick-questions/profiles";

const CARD_COPY: Record<PromptProfile, AnswerVisuals["cards"]> = {
  payment_survival: [
    {
      type: "warning",
      title: "Payment backup",
      body: "Keep at least one backup: a physical card, some RMB cash, or hotel front desk help.",
    },
  ],
  internet_apps: [
    {
      type: "checklist",
      title: "Before departure",
      body: "Set up mobile data, translation, maps, payment, and ride-hailing before relying on them in China.",
    },
  ],
  transport_workflow: [
    {
      type: "checklist",
      title: "Transport workflow",
      body: "Save the Chinese destination, check the pickup point or gate, and keep your passport for rail travel.",
    },
  ],
  tickets_booking: [
    {
      type: "warning",
      title: "Entry risk",
      body: "Popular attractions may require passport-based reservations, time slots, or may close on specific days.",
    },
  ],
  language_cards: [
    {
      type: "phrase",
      title: "Show this",
      body: "请帮我看一下这个地址。谢谢。 / Please help me check this address. Thank you.",
    },
  ],
  emergency_help: [
    {
      type: "warning",
      title: "Safety first",
      body: "If you are unsafe or ill, ask hotel staff, police, hospital staff, or your embassy/consulate for human help immediately.",
    },
  ],
  itinerary_planning: [
    {
      type: "backup",
      title: "Backup route",
      body: "Keep one lower-effort backup plan in case transport, weather, or reservations fail.",
    },
  ],
  food_ordering: [
    {
      type: "phrase",
      title: "Diet phrase",
      body: "不要辣，谢谢。 / No spicy, thank you.",
    },
  ],
  general_travel: [],
};

function createTags(question: string, answer: string) {
  return `${question} ${answer}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function selectAnswerVisuals({
  profile,
  question,
  answer,
}: {
  profile: PromptProfile;
  question: string;
  answer: string;
}): AnswerVisuals | undefined {
  const assets = findAnswerAssets({
    profile,
    tags: [profile, ...createTags(question, answer)],
  });
  const heroAssetId = assets[0]?.id;
  const inlineAssetIds = assets.slice(1).map((asset) => asset.id);
  const cards = CARD_COPY[profile] ?? [];

  if (!heroAssetId && inlineAssetIds.length === 0 && cards.length === 0) {
    return undefined;
  }

  return {
    heroAssetId,
    inlineAssetIds: inlineAssetIds.length > 0 ? inlineAssetIds : undefined,
    cards: cards.length > 0 ? cards : undefined,
  };
}

