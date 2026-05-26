import { AiProviderError } from "../errors";
import type {
  AiProvider,
  AiProviderAdapter,
  AiProviderRequest,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
  TravelAnswerMessage,
} from "../types";

type OpenAiCompatibleConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type OpenAiCompatibleOptions = {
  provider: Exclude<AiProvider, "mock">;
  displayName: string;
  getConfig: () => OpenAiCompatibleConfig;
};

type OpenAiCompatibleResponse = {
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

type OpenAiCompatibleChunk = {
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

type OpenAiCompatibleErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

const AI_QUOTA_EXHAUSTED_MESSAGE =
  "Today's AI usage has been used up. Please come back tomorrow.";
const QUOTA_ERROR_KEYWORDS = [
  "quota",
  "rate limit",
  "ratelimit",
  "insufficient",
  "limit",
  "balance",
  "billing",
];

function createChatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function toOpenAiMessages(messages: TravelAnswerMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function parsePayload<T>(rawText: string): T {
  return rawText ? (JSON.parse(rawText) as T) : ({} as T);
}

function isQuotaError(
  status: number,
  payload: OpenAiCompatibleErrorResponse,
) {
  if (status === 429) {
    return true;
  }

  const errorText = `${payload.error?.code ?? ""} ${
    payload.error?.type ?? ""
  } ${payload.error?.message ?? ""}`.toLowerCase();

  return QUOTA_ERROR_KEYWORDS.some((keyword) => errorText.includes(keyword));
}

function toProviderError(
  provider: Exclude<AiProvider, "mock">,
  displayName: string,
  status: number,
  payload: OpenAiCompatibleErrorResponse,
) {
  if (isQuotaError(status, payload)) {
    return new AiProviderError(
      provider,
      "AI_QUOTA_EXHAUSTED",
      AI_QUOTA_EXHAUSTED_MESSAGE,
      { status, details: payload },
    );
  }

  return new AiProviderError(
    provider,
    payload.error?.code ?? "AI_PROVIDER_REQUEST_FAILED",
    payload.error?.message ?? `${displayName} request failed.`,
    { status, details: payload },
  );
}

function getGenerationOptions() {
  const provider = process.env.AI_PROVIDER?.trim();
  const defaultMaxTokens = provider === "deepseek" ? "2000" : "600";
  const defaultTemperature = provider === "deepseek" ? "0.2" : "0.3";
  const maxTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? defaultMaxTokens);
  const temperature = Number(process.env.AI_TEMPERATURE ?? defaultTemperature);

  return {
    max_tokens:
      Number.isFinite(maxTokens) && maxTokens > 0
        ? Math.floor(maxTokens)
        : Number(defaultMaxTokens),
    temperature:
      Number.isFinite(temperature) && temperature >= 0
        ? temperature
        : Number(defaultTemperature),
  };
}

export function createOpenAiCompatibleProvider({
  provider,
  displayName,
  getConfig,
}: OpenAiCompatibleOptions): AiProviderAdapter {
  return {
    provider,
    async generateAnswer(
      request: AiProviderRequest,
    ): Promise<GenerateTravelAnswerResult> {
      const config = getConfig();
      const startedAt = Date.now();
      const response = await fetch(createChatCompletionsUrl(config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: toOpenAiMessages(request.messages),
          ...getGenerationOptions(),
        }),
        signal: request.signal,
      });

      const rawText = await response.text();
      let payload: OpenAiCompatibleResponse & OpenAiCompatibleErrorResponse;

      try {
        payload = parsePayload(rawText);
      } catch {
        throw new AiProviderError(
          provider,
          "AI_PROVIDER_INVALID_RESPONSE",
          `${displayName} returned a non-JSON response.`,
          { status: response.status, details: rawText },
        );
      }

      if (!response.ok) {
        throw toProviderError(provider, displayName, response.status, payload);
      }

      const content = payload.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new AiProviderError(
          provider,
          "AI_PROVIDER_EMPTY_RESPONSE",
          `${displayName} returned an empty answer.`,
          { status: response.status, details: payload },
        );
      }

      return {
        content,
        provider,
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
      const config = getConfig();
      const startedAt = Date.now();
      const response = await fetch(createChatCompletionsUrl(config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: toOpenAiMessages(request.messages),
          stream: true,
          ...getGenerationOptions(),
        }),
        signal: request.signal,
      });

      if (!response.ok) {
        const rawText = await response.text();
        let payload: OpenAiCompatibleErrorResponse;

        try {
          payload = parsePayload(rawText);
        } catch {
          throw new AiProviderError(
            provider,
            "AI_PROVIDER_INVALID_RESPONSE",
            `${displayName} returned a non-JSON error response.`,
            { status: response.status, details: rawText },
          );
        }

        throw toProviderError(provider, displayName, response.status, payload);
      }

      if (!response.body) {
        throw new AiProviderError(
          provider,
          "AI_PROVIDER_INVALID_RESPONSE",
          `${displayName} returned an empty stream.`,
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

            let payload: OpenAiCompatibleChunk;

            try {
              payload = JSON.parse(data) as OpenAiCompatibleChunk;
            } catch {
              throw new AiProviderError(
                provider,
                "AI_PROVIDER_INVALID_STREAM_CHUNK",
                `${displayName} returned an invalid stream chunk.`,
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
          provider,
          "AI_PROVIDER_EMPTY_RESPONSE",
          `${displayName} returned an empty answer.`,
          { status: response.status },
        );
      }

      yield {
        type: "done",
        result: {
          content: content.trim(),
          provider,
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
}
