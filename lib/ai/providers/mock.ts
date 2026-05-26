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
      "这是一个适合中国旅行的实用起点：",
      "",
      `- 主要问题：${lastUserMessage?.content ?? "你的中国旅行问题"}`,
      "- 预订前先确认城市、日期、预算，以及护照或签证相关限制。",
      "- 保存酒店的中文和英文地址，方便打车、点外卖和办理入住。",
      "- 实用中文：请问这里怎么走？意思是 How do I get here?",
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
