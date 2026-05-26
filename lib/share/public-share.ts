import type { SharedAnswerResponse } from "@/lib/api/types";
import { prisma } from "@/lib/prisma";

type PublicShare = SharedAnswerResponse["share"];

type PublicShareOptions = {
  incrementViewCount?: boolean;
};

export function isPublicShareId(value: string) {
  return /^[a-zA-Z0-9_-]{6,40}$/.test(value);
}

function toPublicShare(share: {
  id: string;
  shareSlug: string;
  question: string;
  answer: string;
  createdAt: Date;
  viewCount: number;
}): PublicShare {
  return {
    id: share.id,
    shareId: share.shareSlug,
    question: share.question,
    answer: share.answer,
    createdAt: share.createdAt.toISOString(),
    viewCount: share.viewCount,
  };
}

export async function getPublicShareBySlug(
  shareId: string,
  options: PublicShareOptions = {},
): Promise<PublicShare | null> {
  if (!isPublicShareId(shareId)) {
    return null;
  }

  const share = await prisma.sharedAnswer.findFirst({
    where: {
      shareSlug: shareId,
      isPublic: true,
      revokedAt: null,
    },
  });

  if (!share) {
    return null;
  }

  if (!options.incrementViewCount) {
    return toPublicShare(share);
  }

  const updatedShare = await prisma.sharedAnswer.update({
    where: {
      id: share.id,
    },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  return toPublicShare(updatedShare);
}
