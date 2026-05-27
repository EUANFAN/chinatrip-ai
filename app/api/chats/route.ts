import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server";
import {
  ChatHistoryResponse,
  CreateChatRequest,
  CreateChatResponse,
} from "@/lib/api/types";
import {
  createChatOwnerData,
  createChatOwnerWhere,
  getCurrentIdentity,
} from "@/lib/auth/current-identity";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function isLanguage(value: unknown): value is "en" | "zh" {
  return value === "en" || value === "zh";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createChatTitle(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function getLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }

  return Math.min(Math.floor(parsed), 50);
}

function createPreview(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return normalized.length > 80 ? `${normalized.slice(0, 80)}...` : normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = getLimit(searchParams.get("limit"));

  try {
    const identity = await getCurrentIdentity();
    const chats = await prisma.chat.findMany({
      where: {
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
          orderBy: [{ sequence: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: limit,
    });

    const response: ChatHistoryResponse = {
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        language: chat.language,
        status: chat.status === "archived" ? "archived" : "active",
        updatedAt: chat.updatedAt.toISOString(),
        lastMessageAt: chat.lastMessageAt.toISOString(),
        preview: createPreview(chat.messages[0]?.content),
      })),
      nextCursor: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get chat history", error);

    return apiError("INTERNAL_ERROR", "Failed to load chat history.", 500);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as CreateChatRequest;
  } catch {
    return apiError("INVALID_REQUEST", "Invalid JSON request body.", 400);
  }

  if (!isRecord(body)) {
    return apiError("INVALID_REQUEST", "Invalid JSON request body.", 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return apiError("EMPTY_MESSAGE", "Please enter your question.", 400);
  }

  const language = body.language ?? "en";

  if (!isLanguage(language)) {
    return apiError("INVALID_LANGUAGE", "Unsupported language.", 400);
  }

  try {
    const identity = await getCurrentIdentity();
    const now = new Date();

    const { chat, firstMessage } = await prisma.$transaction(async (tx) => {
      const createdChat = await tx.chat.create({
        data: {
          ...createChatOwnerData(identity),
          title: createChatTitle(message),
          language,
          status: "active",
          lastMessageAt: now,
        },
      });

      const createdMessage = await tx.message.create({
        data: {
          chatId: createdChat.id,
          role: "user",
          status: "complete",
          sequence: 1,
          content: message,
        },
      });

      return {
        chat: createdChat,
        firstMessage: createdMessage,
      };
    });

    const response: CreateChatResponse = {
      chat: {
        id: chat.id,
        title: chat.title,
        language: chat.language,
        status: "active",
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        lastMessageAt: chat.lastMessageAt.toISOString(),
      },
      firstMessage: {
        id: firstMessage.id,
        chatId: firstMessage.chatId,
        role: "user",
        status: "complete",
        sequence: firstMessage.sequence,
        content: firstMessage.content,
        createdAt: firstMessage.createdAt.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create chat", error);

    return apiError("INTERNAL_ERROR", "Failed to create chat.", 500);
  }
}
