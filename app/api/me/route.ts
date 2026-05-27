import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { getCurrentViewer } from "@/lib/auth/current-identity";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

export async function GET() {
  try {
    const viewer = await getCurrentViewer();

    if (!viewer.profile) {
      return NextResponse.json({
        user: null,
        anonymous: {
          id: viewer.anonymousId,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: viewer.profile.id,
        email: viewer.profile.email,
        name: viewer.profile.name,
        avatarUrl: viewer.profile.avatarUrl,
        locale: viewer.profile.locale,
      },
      anonymous: {
        id: viewer.anonymousId,
      },
    });
  } catch (error) {
    console.error("Failed to get current user", error);

    return apiError("INTERNAL_ERROR", "Failed to load current user.", 500);
  }
}
