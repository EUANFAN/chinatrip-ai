import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { SharedAnswerResponse } from "@/lib/api/types";
import { getCachedPublicShareBySlug } from "@/lib/share/cached-public-share";

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
    const share = await getCachedPublicShareBySlug(shareId, {
      incrementViewCount: true,
    });

    if (!share) {
      return apiError("SHARE_NOT_FOUND", "Share not found.", 404);
    }

    const response: SharedAnswerResponse = {
      share,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get shared answer", error);

    return apiError("INTERNAL_ERROR", "Failed to load shared answer.", 500);
  }
}
