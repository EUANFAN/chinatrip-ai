export type CreateChatRequest = {
  message: string;
  language?: "en" | "zh";
  source?: "home" | "share";
  shareId?: string;
};

export type CreateChatResponse = {
  chat: {
    id: string;
    title: string;
    language: "en" | "zh";
    status: "active";
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
  };
  firstMessage: {
    id: string;
    chatId: string;
    role: "user";
    status: "complete";
    sequence: number;
    content: string;
    createdAt: string;
  };
};

export type ChatDetailMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  status: "pending" | "complete" | "failed";
  sequence: number;
  content: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatDetailResponse = {
  chat: {
    id: string;
    title: string;
    language: "en" | "zh";
    status: "active" | "archived";
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
  };
  messages: ChatDetailMessage[];
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  language: "en" | "zh";
  status: "active" | "archived";
  updatedAt: string;
  lastMessageAt: string;
  preview: string | null;
};

export type ChatHistoryResponse = {
  chats: ChatHistoryItem[];
  nextCursor: string | null;
};

export type SendMessageRequest = {
  message?: string;
};

export type SendMessageResponse = {
  userMessage: {
    id: string;
    chatId: string;
    role: "user";
    status: "complete";
    sequence: number;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
  assistantMessage: {
    id: string;
    chatId: string;
    role: "assistant";
    status: "complete" | "failed";
    sequence: number;
    content: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
  };
  usage: {
    provider: "mock" | "doubao" | "deepseek";
    model: string;
    promptVersion: string;
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number | null;
    fallbackUsed: boolean;
  };
};

export type StreamMessageCreatedEvent = {
  type: "created";
  userMessage: SendMessageResponse["userMessage"];
  assistantMessage: {
    id: string;
    chatId: string;
    role: "assistant";
    status: "pending";
    sequence: number;
    content: string;
    errorCode: null;
    errorMessage: null;
    createdAt: string;
    updatedAt: string;
  };
};

export type StreamMessageDeltaEvent = {
  type: "delta";
  content: string;
};

export type StreamMessageDoneEvent = {
  type: "done";
  assistantMessage: SendMessageResponse["assistantMessage"];
  usage: SendMessageResponse["usage"];
};

export type StreamMessageErrorEvent = {
  type: "error";
  assistantMessage?: SendMessageResponse["assistantMessage"];
  error: {
    code: string;
    message: string;
  };
};

export type StreamMessageEvent =
  | StreamMessageCreatedEvent
  | StreamMessageDeltaEvent
  | StreamMessageDoneEvent
  | StreamMessageErrorEvent;
