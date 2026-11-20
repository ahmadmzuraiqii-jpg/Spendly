function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Today's date in the server's local timezone. Spendly is local-first, so the
 * server runs on the same machine as the user and this matches their clock.
 */
export function todayLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-11-05" -> "Nov 5, 2026" without any timezone shifting. */
export function formatDisplayDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
