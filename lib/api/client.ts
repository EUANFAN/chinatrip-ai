export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor({
    status,
    code,
    message,
    details,
  }: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiFetchOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function shouldSerializeJson(body: unknown): boolean {
  if (body === undefined || body === null) {
    return false;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream
  ) {
    return false;
  }

  return typeof body === "object";
}

function createApiUrl(path: string) {
  if (path.startsWith("/api/")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `/api${path}`;
  }

  return `/api/${path}`;
}

async function parseJsonResponse(response: Response): Promise<{
  data: unknown;
  isValidJson: boolean;
}> {
  const text = await response.text();

  if (!text) {
    return { data: undefined, isValidJson: false };
  }

  try {
    return { data: JSON.parse(text), isValidJson: true };
  } catch {
    return { data: undefined, isValidJson: false };
  }
}

function toFetchBody(body: unknown, serializeJson: boolean): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (serializeJson) {
    return JSON.stringify(body);
  }

  return body as BodyInit;
}

function isApiFetchOptions(value: unknown): value is ApiFetchOptions {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "method" in value ||
    "body" in value ||
    "headers" in value ||
    "credentials" in value ||
    "cache" in value ||
    "next" in value ||
    "signal" in value
  );
}

export async function apiFetch<TResponse>(
  path: string,
): Promise<TResponse>;
export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse>;
export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  input?: TBody | ApiFetchOptions<TBody>,
): Promise<TResponse> {
  const options = isApiFetchOptions(input)
    ? input
    : ({
        method: input === undefined ? "GET" : "POST",
        body: input,
      } satisfies ApiFetchOptions<TBody>);
  const { body, headers: initialHeaders, ...requestOptions } = options;
  const headers = new Headers(initialHeaders);
  const serializeJson = shouldSerializeJson(body);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (serializeJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(createApiUrl(path), {
      ...requestOptions,
      credentials: requestOptions.credentials ?? "same-origin",
      headers,
      body: toFetchBody(body, serializeJson),
    });
  } catch {
    throw new ApiClientError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Network error. Please try again.",
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const { data: responseBody, isValidJson } = await parseJsonResponse(response);

  if (response.ok) {
    if (!isValidJson) {
      throw new ApiClientError({
        status: response.status,
        code: "INVALID_RESPONSE",
        message: "Invalid response from server.",
      });
    }

    return responseBody as TResponse;
  }

  if (isApiErrorBody(responseBody)) {
    throw new ApiClientError({
      status: response.status,
      code: responseBody.error.code,
      message: responseBody.error.message,
      details: responseBody.error.details,
    });
  }

  throw new ApiClientError({
    status: response.status,
    code: "INTERNAL_ERROR",
    message: response.statusText || "Request failed. Please try again.",
  });
}
