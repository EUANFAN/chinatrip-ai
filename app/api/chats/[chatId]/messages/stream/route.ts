import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api/server";
import { SendMessageResponse, StreamMessageEvent } from "@/lib/api/types";
import {
  CurrentIdentity,
  createChatOwnerWhere,
  getCurrentIdentity,
} from "@/lib/auth/current-identity";
import { AiProviderError, streamTravelAnswer } from "@/lib/ai";
import { TRAVEL_ANSWER_PROMPT_VERSION } from "@/lib/ai/prompts/travel-answer";
import { prisma } from "@/lib/prisma";
import { invalidateChatHistoryCacheForRecord } from "@/lib/redis";
import type { StreamTravelAnswerDone, TravelAnswerMessage } from "@/lib/ai/types";

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

function serializePendingAssistantMessage(message: ChatMessageRecord) {
  return {
    id: message.id,
    chatId: message.chatId,
    role: "assistant" as const,
    status: "pending" as const,
    sequence: message.sequence,
    content: message.content,
    errorCode: null,
    errorMessage: null,
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

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: StreamMessageEvent,
) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

async function persistSuccessfulAnswer({
  chatId,
  assistantMessageId,
  content,
  provider,
  model,
  promptVersion,
  inputTokens,
  outputTokens,
  latencyMs,
  fallbackUsed,
  metadata,
}: {
  chatId: string;
  assistantMessageId: string;
  content: string;
  provider: "mock" | "doubao" | "deepseek";
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  fallbackUsed: boolean;
  metadata?: Prisma.InputJsonValue;
}) {
  const assistantMessage = toChatMessageRecord(
    await prisma.message.update({
      where: {
        id: assistantMessageId,
      },
      data: {
        status: "complete",
        content,
        errorCode: null,
        errorMessage: null,
      },
    }),
  );

  await prisma.$transaction([
    prisma.aiUsageLog.create({
      data: {
        chatId,
        messageId: assistantMessage.id,
        provider,
        model,
        promptVersion,
        inputTokens,
        outputTokens,
        latencyMs,
        success: true,
        fallbackUsed,
        metadata,
      },
    }),
    prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        lastMessageAt: new Date(),
      },
    }),
  ]);

  return assistantMessage;
}

async function prepareMessageGeneration({
  chatId,
  identity,
  message,
}: {
  chatId: string;
  identity: CurrentIdentity;
  message: string;
}) {
  return prisma.$transaction(async (tx) => {
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
}

export async function POST(request: Request, context: RouteContext) {
  const requestStartedAt = Date.now();
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

  let prepared: Awaited<ReturnType<typeof prepareMessageGeneration>>;

  try {
    const identity = await getCurrentIdentity();
    prepared = await prepareMessageGeneration({
      chatId,
      identity,
      message,
    });
  } catch (error) {
    if (isUniqueSequenceError(error)) {
      return apiError(
        "MESSAGE_GENERATION_IN_PROGRESS",
        "An answer is already being generated for this chat.",
        409,
      );
    }

    console.error("Failed to prepare stream message", error);
    return apiError("INTERNAL_ERROR", "Failed to send message.", 500);
  }

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

  const preparedAt = Date.now();
  const fastPathAnswer = getFastPathAnswer(prepared.userMessage.content);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let firstDeltaAt: number | null = null;

      writeEvent(controller, {
        type: "created",
        userMessage: serializeUserMessage(prepared.userMessage),
        assistantMessage: serializePendingAssistantMessage(
          prepared.assistantMessage,
        ),
      });

      try {
        if (fastPathAnswer) {
          firstDeltaAt = Date.now();
          writeEvent(controller, {
            type: "delta",
            content: fastPathAnswer,
          });

          const totalLatencyMs = Date.now() - requestStartedAt;
          const assistantMessage = await persistSuccessfulAnswer({
            chatId: prepared.chat.id,
            assistantMessageId: prepared.assistantMessage.id,
            content: fastPathAnswer,
            provider: "mock",
            model: "fast-path-v1",
            promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
            inputTokens: null,
            outputTokens: null,
            latencyMs: totalLatencyMs,
            fallbackUsed: false,
            metadata: {
              fastPath: true,
              requestToPreparedMs: preparedAt - requestStartedAt,
              firstDeltaMs: firstDeltaAt - requestStartedAt,
              totalLatencyMs,
            },
          });
          await invalidateChatHistoryCacheForRecord(prepared.chat);

          writeEvent(controller, {
            type: "done",
            assistantMessage: serializeAssistantMessage(assistantMessage),
            usage: {
              provider: "mock",
              model: "fast-path-v1",
              promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
              inputTokens: null,
              outputTokens: null,
              latencyMs: totalLatencyMs,
              fallbackUsed: false,
            },
          });
          return;
        }

        let streamedContent = "";
        let finalResult: StreamTravelAnswerDone | null = null;

        for await (const chunk of streamTravelAnswer({
          chatId: prepared.chat.id,
          userMessage: prepared.userMessage.content,
          language: prepared.chat.language,
          history: prepared.history,
          signal: request.signal,
        })) {
          if (chunk.type === "delta") {
            firstDeltaAt ??= Date.now();
            streamedContent += chunk.content;
            writeEvent(controller, {
              type: "delta",
              content: chunk.content,
            });
          } else {
            finalResult = chunk;
          }
        }

        if (!finalResult || finalResult.type !== "done") {
          throw new AiProviderError(
            "mock",
            "AI_PROVIDER_EMPTY_RESPONSE",
            "AI provider did not finish the stream.",
          );
        }

        const totalLatencyMs = Date.now() - requestStartedAt;
        const firstDeltaMs =
          firstDeltaAt === null ? null : firstDeltaAt - requestStartedAt;
        const assistantMessage = toChatMessageRecord(
          await prisma.message.update({
            where: {
              id: prepared.assistantMessage.id,
            },
            data: {
              status: "complete",
              content: finalResult.result.content || streamedContent,
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
              provider: finalResult.result.provider,
              model: finalResult.result.model,
              promptVersion: finalResult.result.promptVersion,
              inputTokens: finalResult.result.inputTokens,
              outputTokens: finalResult.result.outputTokens,
              latencyMs: finalResult.result.latencyMs,
              success: true,
              fallbackUsed: finalResult.result.fallbackUsed,
              metadata:
                {
                  ...(typeof finalResult.result.metadata === "object" &&
                  finalResult.result.metadata !== null
                    ? finalResult.result.metadata
                    : {}),
                  requestToPreparedMs: preparedAt - requestStartedAt,
                  firstDeltaMs,
                  totalLatencyMs,
                } as Prisma.InputJsonValue,
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

        const usage: SendMessageResponse["usage"] = {
          provider: finalResult.result.provider,
          model: finalResult.result.model,
          promptVersion: finalResult.result.promptVersion,
          inputTokens: finalResult.result.inputTokens,
          outputTokens: finalResult.result.outputTokens,
          latencyMs: totalLatencyMs,
          fallbackUsed: finalResult.result.fallbackUsed,
        };

        writeEvent(controller, {
          type: "done",
          assistantMessage: serializeAssistantMessage(assistantMessage),
          usage,
        });
      } catch (error) {
        console.error("Failed to stream chat answer", error);

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

        writeEvent(controller, {
          type: "error",
          assistantMessage: serializeAssistantMessage(assistantMessage),
          error: {
            code: assistantMessage.errorCode ?? "AI_PROVIDER_ERROR",
            message:
              assistantMessage.errorMessage ?? "Failed to generate answer.",
          },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
