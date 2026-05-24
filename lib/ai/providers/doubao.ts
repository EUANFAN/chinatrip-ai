import { getDoubaoConfig } from "../config";
import { AiProviderError } from "../errors";
import type {
  AiProviderAdapter,
  AiProviderRequest,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
  TravelAnswerMessage,
} from "../types";

type DoubaoChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  id?: string;
  model?: string;
};

type DoubaoChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  id?: string;
  model?: string;
};

type DoubaoErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

function createChatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function toDoubaoMessages(messages: TravelAnswerMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function parseDoubaoPayload<T>(rawText: string): T {
  return rawText ? JSON.parse(rawText) as T : {} as T;
}

function toProviderError(status: number, payload: DoubaoErrorResponse) {
  return new AiProviderError(
    "doubao",
    payload.error?.code ?? "AI_PROVIDER_REQUEST_FAILED",
    payload.error?.message ?? "Doubao request failed.",
    { status, details: payload },
  );
}

function getGenerationOptions() {
  const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? "600");
  const temperature = Number(process.env.AI_TEMPERATURE ?? "0.3");

  return {
    max_tokens:
      Number.isFinite(maxTokens) && maxTokens > 0
        ? Math.floor(maxTokens)
        : 600,
    temperature:
      Number.isFinite(temperature) && temperature >= 0
        ? temperature
        : 0.3,
  };
}

export const doubaoProvider: AiProviderAdapter = {
  provider: "doubao",
  async generateAnswer(
    request: AiProviderRequest,
  ): Promise<GenerateTravelAnswerResult> {
    const config = getDoubaoConfig();
    const startedAt = Date.now();
    const response = await fetch(createChatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: toDoubaoMessages(request.messages),
        ...getGenerationOptions(),
      }),
      signal: request.signal,
    });

    const rawText = await response.text();
    let payload: DoubaoChatCompletionResponse & DoubaoErrorResponse;

    try {
      payload = parseDoubaoPayload(rawText);
    } catch {
      throw new AiProviderError(
        "doubao",
        "AI_PROVIDER_INVALID_RESPONSE",
        "Doubao returned a non-JSON response.",
        { status: response.status, details: rawText },
      );
    }

    if (!response.ok) {
      throw toProviderError(response.status, payload);
    }

    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AiProviderError(
        "doubao",
        "AI_PROVIDER_EMPTY_RESPONSE",
        "Doubao returned an empty answer.",
        { status: response.status, details: payload },
      );
    }

    return {
      content,
      provider: "doubao",
      model: payload.model ?? config.model,
      promptVersion: request.promptVersion,
      inputTokens: payload.usage?.prompt_tokens ?? null,
      outputTokens: payload.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: false,
      metadata: {
        id: payload.id,
      },
    };
  },
  async *streamAnswer(
    request: AiProviderRequest,
  ): AsyncGenerator<StreamTravelAnswerChunk> {
    const config = getDoubaoConfig();
    const startedAt = Date.now();
    const response = await fetch(createChatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: toDoubaoMessages(request.messages),
        stream: true,
        ...getGenerationOptions(),
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      const rawText = await response.text();
      let payload: DoubaoErrorResponse;

      try {
        payload = parseDoubaoPayload(rawText);
      } catch {
        throw new AiProviderError(
          "doubao",
          "AI_PROVIDER_INVALID_RESPONSE",
          "Doubao returned a non-JSON error response.",
          { status: response.status, details: rawText },
        );
      }

      throw toProviderError(response.status, payload);
    }

    if (!response.body) {
      throw new AiProviderError(
        "doubao",
        "AI_PROVIDER_INVALID_RESPONSE",
        "Doubao returned an empty stream.",
        { status: response.status },
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let model = config.model;
    let responseId: string | undefined;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine || trimmedLine.startsWith(":")) {
            continue;
          }

          if (!trimmedLine.startsWith("data:")) {
            continue;
          }

          const data = trimmedLine.slice(5).trim();

          if (data === "[DONE]") {
            continue;
          }

          let payload: DoubaoChatCompletionChunk;

          try {
            payload = JSON.parse(data) as DoubaoChatCompletionChunk;
          } catch {
            throw new AiProviderError(
              "doubao",
              "AI_PROVIDER_INVALID_STREAM_CHUNK",
              "Doubao returned an invalid stream chunk.",
              { details: data },
            );
          }

          responseId = payload.id ?? responseId;
          model = payload.model ?? model;
          inputTokens = payload.usage?.prompt_tokens ?? inputTokens;
          outputTokens = payload.usage?.completion_tokens ?? outputTokens;

          const delta = payload.choices?.[0]?.delta?.content;

          if (delta) {
            content += delta;
            yield {
              type: "delta",
              content: delta,
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!content.trim()) {
      throw new AiProviderError(
        "doubao",
        "AI_PROVIDER_EMPTY_RESPONSE",
        "Doubao returned an empty answer.",
        { status: response.status },
      );
    }

    yield {
      type: "done",
      result: {
        content: content.trim(),
        provider: "doubao",
        model,
        promptVersion: request.promptVersion,
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startedAt,
        fallbackUsed: false,
        metadata: {
          id: responseId,
        },
      },
    };
  },
};
