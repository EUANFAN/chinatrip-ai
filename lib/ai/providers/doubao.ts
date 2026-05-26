import { getDoubaoConfig } from "../config";
import { createOpenAiCompatibleProvider } from "./openai-compatible";

export const doubaoProvider = createOpenAiCompatibleProvider({
  provider: "doubao",
  displayName: "Doubao",
  getConfig: getDoubaoConfig,
});
