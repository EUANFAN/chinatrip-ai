import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import { ChatDetailResponse } from "@/lib/api/types";
import {
  createChatOwnerWhere,
  getCurrentIdentity,
} from "@/lib/auth/current-identity";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { chatId } = await context.params;

  if (!isUuid(chatId)) {
    return apiError("CHAT_NOT_FOUND", "Chat not found.", 404);
  }

  try {
    const identity = await getCurrentIdentity();
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        status: {
          not: "deleted",
        },
        ...createChatOwnerWhere(identity),
      },
      include: {
        messages: {
          where: {
            role: {
              in: ["user", "assistant"],
            },
          },
          orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!chat || chat.status === "deleted") {
      return apiError("CHAT_NOT_FOUND", "Chat not found.", 404);
    }

    const response: ChatDetailResponse = {
      chat: {
        id: chat.id,
        title: chat.title,
        language: chat.language,
        status: chat.status === "archived" ? "archived" : "active",
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        lastMessageAt: chat.lastMessageAt.toISOString(),
      },
      messages: chat.messages.map((message) => {
        if (message.role !== "user" && message.role !== "assistant") {
          throw new Error(`Unexpected chat message role: ${message.role}`);
        }

        return {
          id: message.id,
          chatId: message.chatId,
          role: message.role,
          status: message.status,
          sequence: message.sequence,
          content: message.content,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get chat detail", error);

    return apiError("INTERNAL_ERROR", "Failed to load chat.", 500);
  }
}
