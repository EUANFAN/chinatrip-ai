import { NextResponse } from "next/server";
import { syncProfileFromSupabaseUser } from "@/lib/auth/current-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await syncProfileFromSupabaseUser(user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
