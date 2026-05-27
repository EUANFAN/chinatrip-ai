import type { PromptProfile } from "@/lib/quick-questions/profiles";

export type AnswerAsset = {
  id: string;
  src: string;
  title: string;
  alt: string;
  category: PromptProfile | "city";
  city?: string;
  poi?: string;
  tags: string[];
  sourceType: "owned" | "licensed" | "generated";
  credit?: string;
};

export const ANSWER_ASSETS: AnswerAsset[] = [];

export function getAnswerAsset(assetId: string) {
  return ANSWER_ASSETS.find((asset) => asset.id === assetId) ?? null;
}

export function findAnswerAssets({
  profile,
  tags,
  limit = 3,
}: {
  profile: PromptProfile;
  tags: string[];
  limit?: number;
}) {
  const normalizedTags = new Set(tags.map((tag) => tag.toLowerCase()));

  return ANSWER_ASSETS.filter((asset) => {
    if (asset.category !== profile && asset.category !== "city") {
      return false;
    }

    return asset.tags.some((tag) => normalizedTags.has(tag.toLowerCase()));
  }).slice(0, limit);
}

