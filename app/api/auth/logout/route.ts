import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to log out", error);

    return apiError("INTERNAL_ERROR", "Failed to log out.", 500);
  }
}
