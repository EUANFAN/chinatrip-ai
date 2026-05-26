import { getOrCreateAnonymousSession } from "@/lib/auth/anonymous-session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function getCurrentIdentity() {
  const anonymousSession = await getOrCreateAnonymousSession();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      anonymousSession,
    };
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadataName = getUserName(metadata);
  const metadataAvatarUrl = getAvatarUrl(metadata);
  const profile = await prisma.profile.upsert({
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

  return {
    profile,
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
    anonymousSessionId: identity.anonymousSession.id,
  };
}
