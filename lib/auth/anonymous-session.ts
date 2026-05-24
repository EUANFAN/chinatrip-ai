import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const ANONYMOUS_ID_COOKIE = "anonymous_id";
const ANONYMOUS_ID_MAX_AGE = 60 * 60 * 24 * 365;

export async function getOrCreateAnonymousSession() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const existingAnonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value;
  const anonymousId = existingAnonymousId ?? crypto.randomUUID();
  const userAgent = headerStore.get("user-agent");

  const anonymousSession = await prisma.anonymousSession.upsert({
    where: { anonymousId },
    create: {
      anonymousId,
      userAgent,
    },
    update: {
      lastActiveAt: new Date(),
      ...(userAgent ? { userAgent } : {}),
    },
  });

  if (!existingAnonymousId) {
    cookieStore.set(ANONYMOUS_ID_COOKIE, anonymousId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ANONYMOUS_ID_MAX_AGE,
      path: "/",
    });
  }

  return anonymousSession;
}

export async function getAnonymousIdFromCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(ANONYMOUS_ID_COOKIE)?.value ?? null;
}
