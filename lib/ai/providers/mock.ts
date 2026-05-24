import type {
  AiProviderAdapter,
  AiProviderRequest,
  GenerateTravelAnswerResult,
  StreamTravelAnswerChunk,
} from "../types";

const MOCK_MODEL = "mock-travel-answer-v1";

function createMockAnswer(request: AiProviderRequest): GenerateTravelAnswerResult {
  const startedAt = Date.now();
  const lastUserMessage = [...request.messages]
    .reverse()
    .find((message) => message.role === "user");

  return {
    content: [
      "Here is a practical starting point for your China trip:",
      "",
      `- Main question: ${lastUserMessage?.content ?? "your travel question"}`,
      "- Confirm city, date, budget, and passport or visa constraints before booking.",
      "- Keep your hotel address in Chinese and English for taxis, delivery, and check-in.",
      "- Useful phrase: 请问这里怎么走？(Qing wen zhe li zen me zou?) - How do I get here?",
    ].join("\n"),
    provider: "mock",
    model: MOCK_MODEL,
    promptVersion: request.promptVersion,
    inputTokens: null,
    outputTokens: null,
    latencyMs: Date.now() - startedAt,
    fallbackUsed: false,
    metadata: {
      chatId: request.chatId,
    },
  };
}

export const mockProvider: AiProviderAdapter = {
  provider: "mock",
  async generateAnswer(
    request: AiProviderRequest,
  ): Promise<GenerateTravelAnswerResult> {
    return createMockAnswer(request);
  },
  async *streamAnswer(
    request: AiProviderRequest,
  ): AsyncGenerator<StreamTravelAnswerChunk> {
    const answer = createMockAnswer(request);
    const chunks = answer.content.match(/.{1,32}(\s|$)/g) ?? [answer.content];

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 70));
      yield {
        type: "delta",
        content: chunk,
      };
    }

    yield {
      type: "done",
      result: answer,
    };
  },
};
