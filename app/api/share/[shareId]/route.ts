import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { SharedAnswerResponse } from "@/lib/api/types";
import {
  SHARE_CACHE_TTL_SECONDS,
  createShareCacheKey,
  safeGetJson,
  safeSetJson,
} from "@/lib/redis";
import { getPublicShareBySlug } from "@/lib/share/public-share";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type RouteContext = {
  params: Promise<{
    shareId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { shareId } = await context.params;

  try {
    const cacheKey = createShareCacheKey(shareId);
    const cachedResponse = await safeGetJson<SharedAnswerResponse>(cacheKey);

    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const share = await getPublicShareBySlug(shareId, {
      incrementViewCount: true,
    });

    if (!share) {
      return apiError("SHARE_NOT_FOUND", "Share not found.", 404);
    }

    const response: SharedAnswerResponse = {
      share,
    };

    await safeSetJson(cacheKey, response, SHARE_CACHE_TTL_SECONDS);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get shared answer", error);

    return apiError("INTERNAL_ERROR", "Failed to load shared answer.", 500);
  }
}
