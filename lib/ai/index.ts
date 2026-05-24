import "server-only";

import { getConfiguredProvider } from "./config";
import { TRAVEL_ANSWER_PROMPT_VERSION, buildTravelAnswerMessages } from "./prompts/travel-answer";
import { deepseekProvider } from "./providers/deepseek";
import { doubaoProvider } from "./providers/doubao";
import { mockProvider } from "./providers/mock";
import type {
  AiProvider,
  AiProviderAdapter,
  GenerateTravelAnswerInput,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
} from "./types";

const PROVIDERS: Record<AiProvider, AiProviderAdapter> = {
  mock: mockProvider,
  doubao: doubaoProvider,
  deepseek: deepseekProvider,
};

export async function generateTravelAnswer(
  input: GenerateTravelAnswerInput,
): Promise<GenerateTravelAnswerResult> {
  const language = input.language ?? "en";
  const provider = PROVIDERS[getConfiguredProvider()];

  return provider.generateAnswer({
    chatId: input.chatId,
    language,
    messages: buildTravelAnswerMessages({
      ...input,
      language,
    }),
    promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
  });
}

export async function* streamTravelAnswer(
  input: GenerateTravelAnswerInput & { signal?: AbortSignal },
): AsyncGenerator<StreamTravelAnswerChunk> {
  const language = input.language ?? "en";
  const provider = PROVIDERS[getConfiguredProvider()];
  const request = {
    chatId: input.chatId,
    language,
    messages: buildTravelAnswerMessages({
      ...input,
      language,
    }),
    promptVersion: TRAVEL_ANSWER_PROMPT_VERSION,
    signal: input.signal,
  };

  if (provider.streamAnswer) {
    yield* provider.streamAnswer(request);
    return;
  }

  const result = await provider.generateAnswer(request);

  if (result.content) {
    yield {
      type: "delta",
      content: result.content,
    };
  }

  yield {
    type: "done",
    result,
  };
}

export type {
  AiProvider,
  AiProviderAdapter,
  GenerateTravelAnswerInput,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
  TravelAnswerLanguage,
  TravelAnswerMessage,
} from "./types";
export { AiProviderConfigError, AiProviderError } from "./errors";
