import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { getCurrentIdentity } from "@/lib/auth/current-identity";

export const runtime = "nodejs";

export async function GET() {
  try {
    const identity = await getCurrentIdentity();

    if (!identity.profile) {
      return NextResponse.json({
        user: null,
        anonymous: {
          id: identity.anonymousSession.anonymousId,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: identity.profile.id,
        email: identity.profile.email,
        name: identity.profile.name,
        avatarUrl: identity.profile.avatarUrl,
        locale: identity.profile.locale,
      },
      anonymous: {
        id: identity.anonymousSession.anonymousId,
      },
    });
  } catch (error) {
    console.error("Failed to get current user", error);

    return apiError("INTERNAL_ERROR", "Failed to load current user.", 500);
  }
}
