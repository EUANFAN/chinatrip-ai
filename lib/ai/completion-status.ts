const MIN_MAYBE_TRUNCATED_LENGTH = 2500;
const COMPLETE_ENDING_PATTERN = /[.!?。！？)\]]$/;
const INCOMPLETE_ENDING_PATTERN = /[:;,，；：]$/;
const INCOMPLETE_LAST_LINE_PATTERN =
  /^(?:#{1,6}\s+\S.*|\d+[\.)]\s*|[-*]\s*)$/;

export function isProbablyIncompleteAnswer(content: string) {
  const normalized = content.trim();

  if (normalized.length < MIN_MAYBE_TRUNCATED_LENGTH) {
    return false;
  }

  const lastLine = normalized.split(/\r?\n/).at(-1)?.trim() ?? "";

  return (
    !COMPLETE_ENDING_PATTERN.test(normalized) ||
    INCOMPLETE_ENDING_PATTERN.test(normalized) ||
    INCOMPLETE_LAST_LINE_PATTERN.test(lastLine)
  );
}

export function mergeCompletionStatusMetadata(
  metadata: unknown,
  content: string,
) {
  const baseMetadata =
    typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
      ? metadata
      : {};
  const finishReason =
    "finishReason" in baseMetadata &&
    typeof baseMetadata.finishReason === "string"
      ? baseMetadata.finishReason
      : null;
  const truncated =
    ("truncated" in baseMetadata && baseMetadata.truncated === true) ||
    finishReason === "length";
  const maybeTruncated = !truncated && isProbablyIncompleteAnswer(content);

  return {
    ...baseMetadata,
    finishReason,
    truncated,
    maybeTruncated,
  };
}

