import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api/server";
import { SendMessageResponse } from "@/lib/api/types";
import {
  createChatOwnerWhere,
  getCurrentIdentity,
} from "@/lib/auth/current-identity";
import { generateTravelAnswer, AiProviderError } from "@/lib/ai";
import { TRAVEL_ANSWER_PROMPT_VERSION } from "@/lib/ai/prompts/travel-answer";
import { prisma } from "@/lib/prisma";
import { invalidateChatHistoryCacheForRecord } from "@/lib/redis";
import type { TravelAnswerMessage } from "@/lib/ai/types";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CONTENT_LENGTH = 1200;

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

type ChatMessageRecord = {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  status: "pending" | "complete" | "failed";
  sequence: number;
  content: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toChatMessageRecord(message: {
  id: string;
  chatId: string;
  role: string;
  status: "pending" | "complete" | "failed";
  sequence: number;
  content: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ChatMessageRecord {
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
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function serializeUserMessage(message: ChatMessageRecord) {
  return {
    id: message.id,
    chatId: message.chatId,
    role: "user" as const,
    status: "complete" as const,
    sequence: message.sequence,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

function serializeAssistantMessage(message: ChatMessageRecord) {
  return {
    id: message.id,
    chatId: message.chatId,
    role: "assistant" as const,
    status:
      message.status === "failed" ? ("failed" as const) : ("complete" as const),
    sequence: message.sequence,
    content: message.content,
    errorCode: message.errorCode,
    errorMessage: message.errorMessage,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

function toTravelHistory(messages: ChatMessageRecord[]): TravelAnswerMessage[] {
  return messages
    .filter((message) => message.status === "complete")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content:
        message.content.length > MAX_HISTORY_CONTENT_LENGTH
          ? `${message.content.slice(0, MAX_HISTORY_CONTENT_LENGTH)}...`
          : message.content,
    }));
}

function getFastPathAnswer(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!["hello", "hi", "hey", "thanks", "thank you"].includes(normalized)) {
    return null;
  }

  if (normalized === "thanks" || normalized === "thank you") {
    return "You're welcome. Ask me any China travel question when you're ready.";
  }

  return "Hello. Ask me about China travel, payments, trains, apps, food, or local tips.";
}

function createUnknownUsage(error: unknown) {
  return {
    provider: error instanceof AiProviderError ? error.provider : ("mock" as const),
    model: "unknown",
    promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
    inputTokens: null,
    outputTokens: null,
    latencyMs: null,
    fallbackUsed: false,
  };
}

function getAiErrorCode(error: unknown) {
  return error instanceof AiProviderError
    ? error.code
    : "AI_PROVIDER_ERROR";
}

function getAiErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to generate answer.";
}

function isUniqueSequenceError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { chatId } = await context.params;

  if (!isUuid(chatId)) {
    return apiError("CHAT_NOT_FOUND", "Chat not found.", 404);
  }

  let body: unknown = {};

  try {
    const requestText = await request.text();
    body = requestText ? JSON.parse(requestText) : {};
  } catch {
    return apiError("INVALID_REQUEST", "Invalid JSON request body.", 400);
  }

  if (!isRecord(body)) {
    return apiError("INVALID_REQUEST", "Invalid JSON request body.", 400);
  }

  const hasMessageField = "message" in body;
  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (hasMessageField && !message) {
    return apiError("EMPTY_MESSAGE", "Please enter your question.", 400);
  }

  try {
    const identity = await getCurrentIdentity();
    const prepared = await prisma.$transaction(async (tx) => {
      const chat = await tx.chat.findFirst({
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

      if (!chat) {
        return null;
      }

      const existingMessages = chat.messages.map(toChatMessageRecord);
      const lastSequence = existingMessages.at(-1)?.sequence ?? 0;
      const lastMessage = existingMessages.at(-1);

      if (lastMessage?.role === "assistant" && lastMessage.status === "pending") {
        return {
          chat,
          generationInProgress: true as const,
        };
      }

      if (message) {
        const userMessage = toChatMessageRecord(
          await tx.message.create({
            data: {
              chatId: chat.id,
              role: "user",
              status: "complete",
              sequence: lastSequence + 1,
              content: message,
            },
          }),
        );
        const assistantMessage = toChatMessageRecord(
          await tx.message.create({
            data: {
              chatId: chat.id,
              role: "assistant",
              status: "pending",
              sequence: lastSequence + 2,
              content: "",
            },
          }),
        );

        return {
          chat,
          userMessage,
          assistantMessage,
          history: toTravelHistory(existingMessages),
        };
      }

      if (
        !lastMessage ||
        lastMessage.role !== "user" ||
        lastMessage.status !== "complete"
      ) {
        return {
          chat,
          noUnansweredUserMessage: true as const,
        };
      }

      const assistantMessage = toChatMessageRecord(
        await tx.message.create({
          data: {
            chatId: chat.id,
            role: "assistant",
            status: "pending",
            sequence: lastMessage.sequence + 1,
            content: "",
          },
        }),
      );

      return {
        chat,
        userMessage: lastMessage,
        assistantMessage,
        history: toTravelHistory(existingMessages.slice(0, -1)),
      };
    });

    if (!prepared) {
      return apiError("CHAT_NOT_FOUND", "Chat not found.", 404);
    }

    if ("noUnansweredUserMessage" in prepared) {
      return apiError(
        "NO_UNANSWERED_MESSAGE",
        "There is no unanswered user message.",
        409,
      );
    }

    if ("generationInProgress" in prepared) {
      return apiError(
        "MESSAGE_GENERATION_IN_PROGRESS",
        "An answer is already being generated for this chat.",
        409,
      );
    }

    try {
      const fastPathAnswer = getFastPathAnswer(prepared.userMessage.content);

      if (fastPathAnswer) {
        const assistantMessage = toChatMessageRecord(
          await prisma.message.update({
            where: {
              id: prepared.assistantMessage.id,
            },
            data: {
              status: "complete",
              content: fastPathAnswer,
              errorCode: null,
              errorMessage: null,
            },
          }),
        );

        await prisma.$transaction([
          prisma.aiUsageLog.create({
            data: {
              chatId: prepared.chat.id,
              messageId: assistantMessage.id,
              provider: "mock",
              model: "fast-path-v1",
              promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
              inputTokens: null,
              outputTokens: null,
              latencyMs: 0,
              success: true,
              fallbackUsed: false,
              metadata: {
                fastPath: true,
              },
            },
          }),
          prisma.chat.update({
            where: {
              id: prepared.chat.id,
            },
            data: {
              lastMessageAt: new Date(),
            },
          }),
        ]);
        await invalidateChatHistoryCacheForRecord(prepared.chat);

        const response: SendMessageResponse = {
          userMessage: serializeUserMessage(prepared.userMessage),
          assistantMessage: serializeAssistantMessage(assistantMessage),
          usage: {
            provider: "mock",
            model: "fast-path-v1",
            promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
            inputTokens: null,
            outputTokens: null,
            latencyMs: 0,
            fallbackUsed: false,
          },
        };

        return NextResponse.json(response);
      }

      const aiResult = await generateTravelAnswer({
        chatId: prepared.chat.id,
        userMessage: prepared.userMessage.content,
        language: prepared.chat.language,
        history: prepared.history,
      });
      const now = new Date();
      const assistantMessage = toChatMessageRecord(
        await prisma.message.update({
          where: {
            id: prepared.assistantMessage.id,
          },
          data: {
            status: "complete",
            content: aiResult.content,
            errorCode: null,
            errorMessage: null,
          },
        }),
      );

      await prisma.$transaction([
        prisma.aiUsageLog.create({
          data: {
            chatId: prepared.chat.id,
            messageId: assistantMessage.id,
            provider: aiResult.provider,
            model: aiResult.model,
            promptVersion: aiResult.promptVersion,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
            latencyMs: aiResult.latencyMs,
            success: true,
            fallbackUsed: aiResult.fallbackUsed,
            metadata:
              aiResult.metadata === undefined
                ? undefined
                : (aiResult.metadata as Prisma.InputJsonValue),
          },
        }),
        prisma.chat.update({
          where: {
            id: prepared.chat.id,
          },
          data: {
            lastMessageAt: now,
          },
        }),
      ]);
      await invalidateChatHistoryCacheForRecord(prepared.chat);

      const response: SendMessageResponse = {
        userMessage: serializeUserMessage(prepared.userMessage),
        assistantMessage: serializeAssistantMessage(assistantMessage),
        usage: {
          provider: aiResult.provider,
          model: aiResult.model,
          promptVersion: aiResult.promptVersion,
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          latencyMs: aiResult.latencyMs,
          fallbackUsed: aiResult.fallbackUsed,
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Failed to generate chat answer", error);

      const usage = createUnknownUsage(error);
      const assistantMessage = toChatMessageRecord(
        await prisma.message.update({
          where: {
            id: prepared.assistantMessage.id,
          },
          data: {
            status: "failed",
            content: "",
            errorCode: getAiErrorCode(error),
            errorMessage: getAiErrorMessage(error),
          },
        }),
      );

      await prisma.$transaction([
        prisma.aiUsageLog.create({
          data: {
            chatId: prepared.chat.id,
            messageId: assistantMessage.id,
            provider: usage.provider,
            model: usage.model,
            promptVersion: usage.promptVersion,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: usage.latencyMs,
            success: false,
            fallbackUsed: usage.fallbackUsed,
            errorMessage: assistantMessage.errorMessage,
          },
        }),
        prisma.chat.update({
          where: {
            id: prepared.chat.id,
          },
          data: {
            lastMessageAt: new Date(),
          },
        }),
      ]);
      await invalidateChatHistoryCacheForRecord(prepared.chat);

      const response: SendMessageResponse = {
        userMessage: serializeUserMessage(prepared.userMessage),
        assistantMessage: serializeAssistantMessage(assistantMessage),
        usage,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    if (isUniqueSequenceError(error)) {
      return apiError(
        "MESSAGE_GENERATION_IN_PROGRESS",
        "An answer is already being generated for this chat.",
        409,
      );
    }

    console.error("Failed to send chat message", error);

    return apiError("INTERNAL_ERROR", "Failed to send message.", 500);
  }
}
