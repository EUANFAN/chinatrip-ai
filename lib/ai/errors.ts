import type { AiProvider } from "./types";

export class AiProviderError extends Error {
  provider: AiProvider;
  code: string;
  status?: number;
  details?: unknown;

  constructor(
    provider: AiProvider,
    code: string,
    message: string,
    options?: { status?: number; details?: unknown },
  ) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

export class AiProviderConfigError extends AiProviderError {
  constructor(provider: AiProvider, message: string, details?: unknown) {
    super(provider, "AI_PROVIDER_CONFIG_ERROR", message, { details });
    this.name = "AiProviderConfigError";
  }
}
