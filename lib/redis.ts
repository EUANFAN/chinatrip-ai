import "server-only";

import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export const CHAT_HISTORY_CACHE_TTL_SECONDS = 60;
export const SHARE_CACHE_TTL_SECONDS = 60 * 10;

const CHAT_HISTORY_INVALIDATION_LIMITS = [30, 50] as const;

export type ChatHistoryCacheOwner =
  | {
      type: "profile";
      profileId: string;
    }
  | {
      type: "anonymous";
      anonymousSessionId: string;
    };

export function createChatHistoryCacheKey(
  owner: ChatHistoryCacheOwner,
  limit: number,
) {
  if (owner.type === "profile") {
    return `chat-history:profile:${owner.profileId}:limit:${limit}`;
  }

  return `chat-history:anonymous:${owner.anonymousSessionId}:limit:${limit}`;
}

export function createShareCacheKey(shareId: string) {
  return `share:${shareId}`;
}

export function createChatHistoryOwnerFromRecord(record: {
  profileId: string | null;
  anonymousSessionId: string | null;
}): ChatHistoryCacheOwner | null {
  if (record.profileId) {
    return {
      type: "profile",
      profileId: record.profileId,
    };
  }

  if (record.anonymousSessionId) {
    return {
      type: "anonymous",
      anonymousSessionId: record.anonymousSessionId,
    };
  }

  return null;
}

export async function safeGetJson<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.warn("Redis get failed", { key, error });

    return null;
  }
}

export async function safeSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
) {
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, value, {
      ex: ttlSeconds,
    });
  } catch (error) {
    console.warn("Redis set failed", { key, error });
  }
}

export async function safeDelete(...keys: string[]) {
  if (!redis || keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn("Redis delete failed", { keys, error });
  }
}

export async function invalidateChatHistoryCache(
  owner: ChatHistoryCacheOwner | null,
) {
  if (!owner) {
    return;
  }

  await safeDelete(
    ...CHAT_HISTORY_INVALIDATION_LIMITS.map((limit) =>
      createChatHistoryCacheKey(owner, limit),
    ),
  );
}

export async function invalidateChatHistoryCacheForRecord(record: {
  profileId: string | null;
  anonymousSessionId: string | null;
}) {
  await invalidateChatHistoryCache(createChatHistoryOwnerFromRecord(record));
}

