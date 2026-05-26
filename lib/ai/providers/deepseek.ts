import { getDeepSeekConfig } from "../config";
import { createOpenAiCompatibleProvider } from "./openai-compatible";

export const deepseekProvider = createOpenAiCompatibleProvider({
  provider: "deepseek",
  displayName: "DeepSeek",
  getConfig: getDeepSeekConfig,
});
