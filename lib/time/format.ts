const DEFAULT_TIME_ZONE = "Asia/Shanghai";

export function formatChinaTripDate(value?: string | Date | null) {
  if (!value) {
    return "Shared travel answer";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Shared travel answer";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DEFAULT_TIME_ZONE,
  }).format(date);
}
