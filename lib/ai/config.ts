import "server-only";

import { AiProviderConfigError } from "./errors";
import type { AiProvider } from "./types";

export type AiProviderConfig = {
  provider: AiProvider;
};

export type DoubaoConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type DeepSeekConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

const SUPPORTED_PROVIDERS = new Set<AiProvider>(["mock", "doubao", "deepseek"]);

export function getConfiguredProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER ?? "mock").trim() as AiProvider;

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    throw new AiProviderConfigError(
      "mock",
      `Unsupported AI_PROVIDER "${provider}". Use "mock", "doubao", or "deepseek".`,
    );
  }

  return provider;
}

export function getDoubaoConfig(): DoubaoConfig {
  const apiKey = process.env.DOUBAO_API_KEY?.trim();
  const baseUrl = process.env.DOUBAO_BASE_URL?.trim();
  const model = (
    process.env.DOUBAO_MODEL ??
    process.env.DOUBAO_DEFAULT_MODEL ??
    ""
  ).trim();

  const missing = [
    ["DOUBAO_API_KEY", apiKey],
    ["DOUBAO_BASE_URL", baseUrl],
    ["DOUBAO_MODEL", model],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new AiProviderConfigError(
      "doubao",
      `Missing Doubao configuration: ${missing.join(", ")}.`,
      { missing },
    );
  }

  if (!apiKey || !baseUrl || !model) {
    throw new AiProviderConfigError(
      "doubao",
      "Doubao configuration is invalid.",
    );
  }

  return {
    apiKey,
    baseUrl,
    model,
  };
}

export function getDeepSeekConfig(): DeepSeekConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = (
    process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
  ).trim();
  const model = (
    process.env.DEEPSEEK_MODEL ??
    process.env.DEEPSEEK_DEFAULT_MODEL ??
    "deepseek-chat"
  ).trim();

  const missing = [
    ["DEEPSEEK_API_KEY", apiKey],
    ["DEEPSEEK_BASE_URL", baseUrl],
    ["DEEPSEEK_MODEL", model],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new AiProviderConfigError(
      "deepseek",
      `Missing DeepSeek configuration: ${missing.join(", ")}.`,
      { missing },
    );
  }

  if (!apiKey || !baseUrl || !model) {
    throw new AiProviderConfigError(
      "deepseek",
      "DeepSeek configuration is invalid.",
    );
  }

  return {
    apiKey,
    baseUrl,
    model,
  };
}
