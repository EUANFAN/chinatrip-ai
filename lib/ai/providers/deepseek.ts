import { AiProviderConfigError } from "../errors";
import type {
  AiProviderAdapter,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
} from "../types";

export const deepseekProvider: AiProviderAdapter = {
  provider: "deepseek",
  async generateAnswer(): Promise<GenerateTravelAnswerResult> {
    throw new AiProviderConfigError(
      "deepseek",
      "DeepSeek provider is reserved but not implemented yet.",
    );
  },
  async *streamAnswer(): AsyncGenerator<StreamTravelAnswerChunk> {
    throw new AiProviderConfigError(
      "deepseek",
      "DeepSeek provider is reserved but not implemented yet.",
    );
  },
};
