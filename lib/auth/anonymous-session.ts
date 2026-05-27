import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const ANONYMOUS_ID_COOKIE = "anonymous_id";
const ANONYMOUS_ID_MAX_AGE = 60 * 60 * 24 * 365;

function createAnonymousIdCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ANONYMOUS_ID_MAX_AGE,
    path: "/",
  };
}

export async function getOrCreateAnonymousIdCookie() {
  const cookieStore = await cookies();
  const existingAnonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value;

  if (existingAnonymousId) {
    return existingAnonymousId;
  }

  const anonymousId = crypto.randomUUID();

  cookieStore.set(
    ANONYMOUS_ID_COOKIE,
    anonymousId,
    createAnonymousIdCookieOptions(),
  );

  return anonymousId;
}

export async function getOrCreateAnonymousSession() {
  const headerStore = await headers();
  const anonymousId = await getOrCreateAnonymousIdCookie();
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

  return anonymousSession;
}

export async function getAnonymousIdFromCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(ANONYMOUS_ID_COOKIE)?.value ?? null;
}
