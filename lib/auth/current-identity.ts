import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import {
  getAnonymousIdFromCookie,
  getOrCreateAnonymousIdCookie,
  getOrCreateAnonymousSession,
} from "@/lib/auth/anonymous-session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

function getUserName(metadata: Record<string, unknown> | undefined) {
  const name = metadata?.name ?? metadata?.full_name;

  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function getAvatarUrl(metadata: Record<string, unknown> | undefined) {
  const avatarUrl = metadata?.avatar_url ?? metadata?.picture;

  return typeof avatarUrl === "string" && avatarUrl.trim()
    ? avatarUrl.trim()
    : null;
}

async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
}

async function getSupabaseUserFromCookie() {
  if (!(await hasSupabaseAuthCookie())) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function syncProfileFromSupabaseUser(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataName = getUserName(metadata);
  const metadataAvatarUrl = getAvatarUrl(metadata);

  return prisma.profile.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      email: user.email ?? null,
      name: metadataName,
      avatarUrl: metadataAvatarUrl,
    },
    update: {
      email: user.email ?? null,
      ...(metadataName ? { name: metadataName } : {}),
      ...(metadataAvatarUrl ? { avatarUrl: metadataAvatarUrl } : {}),
    },
  });
}

async function getOrCreateProfileForUser(user: User) {
  const existingProfile = await prisma.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existingProfile) {
    return existingProfile;
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataName = getUserName(metadata);
  const metadataAvatarUrl = getAvatarUrl(metadata);

  try {
    return await prisma.profile.create({
      data: {
        userId: user.id,
        email: user.email ?? null,
        name: metadataName,
        avatarUrl: metadataAvatarUrl,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const racedProfile = await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (racedProfile) {
        return racedProfile;
      }
    }

    throw error;
  }
}

async function getCurrentProfile() {
  const user = await getSupabaseUserFromCookie();

  if (!user) {
    return null;
  }

  return getOrCreateProfileForUser(user);
}

export async function getCurrentViewer() {
  const anonymousId = await getOrCreateAnonymousIdCookie();
  const profile = await getCurrentProfile();

  return {
    profile,
    anonymousId,
  };
}

export async function getChatHistoryOwner() {
  const user = await getSupabaseUserFromCookie();

  if (user) {
    const profile =
      (await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      })) ?? (await syncProfileFromSupabaseUser(user));

    return {
      type: "profile" as const,
      profileId: profile.id,
    };
  }

  const anonymousId = await getAnonymousIdFromCookie();

  if (!anonymousId) {
    return null;
  }

  const anonymousSession = await prisma.anonymousSession.findUnique({
    where: {
      anonymousId,
    },
    select: {
      id: true,
    },
  });

  if (!anonymousSession) {
    return null;
  }

  return {
    type: "anonymous" as const,
    anonymousSessionId: anonymousSession.id,
  };
}

export async function getCurrentIdentity() {
  const profile = await getCurrentProfile();

  if (profile) {
    return {
      profile,
      anonymousSession: null,
    };
  }

  const anonymousSession = await getOrCreateAnonymousSession();

  return {
    profile: null,
    anonymousSession,
  };
}

export type CurrentIdentity = Awaited<ReturnType<typeof getCurrentIdentity>>;

export function createChatOwnerWhere(identity: CurrentIdentity) {
  if (identity.profile) {
    return {
      profileId: identity.profile.id,
    };
  }

  return {
    anonymousSessionId: identity.anonymousSession.id,
  };
}

export function createChatOwnerData(identity: CurrentIdentity) {
  return {
    profileId: identity.profile?.id ?? null,
    anonymousSessionId: identity.anonymousSession?.id ?? null,
  };
}
