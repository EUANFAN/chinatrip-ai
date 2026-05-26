import type {
  GenerateTravelAnswerInput,
  TravelAnswerMessage,
} from "../types";
import { buildCorePrompt } from "./core";
import { buildIntentClassifierPrompt } from "./intent-classifier";
import { buildOutputContractPrompt } from "./output-contract";
import { buildPainPointsPrompt } from "./pain-points";
import { buildTemplatesPrompt } from "./templates";

export const TRAVEL_ANSWER_PROMPT_VERSION = "travel-answer-v7-deepseek-structured";

export function buildTravelAnswerMessages(
  input: GenerateTravelAnswerInput,
): TravelAnswerMessage[] {
  const language = input.language ?? "en";
  const history = input.history ?? [];

  return [
    {
      role: "system",
      content: [
        buildCorePrompt(language),
        buildPainPointsPrompt(),
        buildIntentClassifierPrompt(),
        buildTemplatesPrompt(),
        buildOutputContractPrompt(),
      ].join("\n"),
    },
    ...history,
    {
      role: "user",
      content: input.userMessage,
    },
  ];
}
