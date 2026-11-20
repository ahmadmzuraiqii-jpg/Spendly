/**
 * Pure date-window and aggregation logic for the dashboard.
 *
 * Every monetary value stays in integer minor units (1 JOD = 1000) and is
 * only summed/subtracted here — no floating-point arithmetic touches money.
 * Percentages are computed with integer math and returned in tenths of a
 * percent so a single display rounding is the only conversion. Date handling
 * is calendar-only (local `Date` parts, ISO `YYYY-MM-DD` strings), never
 * timezone-sensitive epoch math on money.
 */

export type RangeId =
  | "this-month"
  | "last-month"
  | "last-3-months"
  | "this-year"
  | "custom";

export type DateWindow = {
  start: string;
  end: string;
  label: string;
  prevStart: string;
  prevEnd: string;
  prevLabel: string;
};

export type PeriodBucket = {
  key: string;
  label: string;
  incomeMinor: number;
  expenseMinor: number;
};

export type Summary = {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  count: number;
  prevIncomeMinor: number;
  prevExpenseMinor: number;
  prevNetMinor: number;
  prevCount: number;
};

export type ExpenseSlice = {
  categoryId: number;
  name: string;
  color: string;
  icon: string;
  amountMinor: number;
  /** Share of total expenses in tenths of a percent (sums to ~1000). */
  shareX10: number;
};

/* ------------------------------------------------------------------ */
/* Calendar helpers (local time, no timezone shifting)                 */
/* ------------------------------------------------------------------ */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseIso(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // Clamp to the target month's length so Jan 31 -1 month becomes Dec 31.
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/* ------------------------------------------------------------------ */
/* Date ranges                                                         */
/* ------------------------------------------------------------------ */

export const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-3-months", label: "Last 3 months" },
  { id: "this-year", label: "This year" },
  { id: "custom", label: "Custom" },
];

/** Sensible defaults when the user switches to the custom range. */
export function defaultCustomRange(todayIso: string): {
  from: string;
  to: string;
} {
  const today = parseIso(todayIso);
  return { from: toIso(startOfMonth(today)), to: todayIso };
}

/**
 * Resolves a range into the selected window plus an equal-shape previous
 * window for the month-over-month (or period-over-period) comparison:
 * - month ranges compare against the immediately preceding calendar span,
 * - "this year" compares against the full previous year,
 * - custom ranges compare against the equally long span right before them.
 */
export function resolveRange(
  rangeId: RangeId,
  custom: { from: string; to: string },
  todayIso: string,
): DateWindow {
  const today = parseIso(todayIso);

  switch (rangeId) {
    case "last-month": {
      const month = addMonths(startOfMonth(today), -1);
      return {
        start: toIso(startOfMonth(month)),
        end: toIso(endOfMonth(month)),
        label: "Last month",
        prevStart: toIso(startOfMonth(addMonths(month, -1))),
        prevEnd: toIso(endOfMonth(addMonths(month, -1))),
        prevLabel: "vs the month before",
      };
    }
    case "last-3-months": {
      // Current span: this calendar month plus the two before it.
      const spanEnd = endOfMonth(today);
      const spanStart = startOfMonth(addMonths(today, -2));
      const prevEnd = addDays(startOfMonth(spanStart), -1);
      const prevStart = startOfMonth(addMonths(spanStart, -3));
      return {
        start: toIso(spanStart),
        end: toIso(spanEnd),
        label: "Last 3 months",
        prevStart: toIso(prevStart),
        prevEnd: toIso(prevEnd),
        prevLabel: "vs previous 3 months",
      };
    }
    case "this-year": {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      return {
        start: toIso(yearStart),
        end: toIso(yearEnd),
        label: "This year",
        prevStart: toIso(new Date(today.getFullYear() - 1, 0, 1)),
        prevEnd: toIso(new Date(today.getFullYear() - 1, 11, 31)),
        prevLabel: "vs last year",
      };
    }
    case "custom": {
      let from = custom.from;
      let to = custom.to;
      if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
        if (from > to) {
          [from, to] = [to, from];
        }
        const lengthDays =
          Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86400000) + 1;
        const prevEnd = addDays(parseIso(from), -1);
        const prevStart = addDays(prevEnd, -(lengthDays - 1));
        return {
          start: from,
          end: to,
          label: "Custom range",
          prevStart: toIso(prevStart),
          prevEnd: toIso(prevEnd),
          prevLabel: "vs previous period",
        };
      }
      // Invalid/empty input falls back to the current month.
      return resolveRange("this-month", custom, todayIso);
    }
    case "this-month":
    default: {
      return {
        start: toIso(startOfMonth(today)),
        end: toIso(endOfMonth(today)),
        label: "This month",
        prevStart: toIso(startOfMonth(addMonths(today, -1))),
        prevEnd: toIso(endOfMonth(addMonths(today, -1))),
        prevLabel: "vs last month",
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Aggregation (integer minor units only)                              */
/* ------------------------------------------------------------------ */

type DatedAmount = {
  transaction_date: string;
  type: "income" | "expense";
  amount_minor: number;
};

function within(
  transactionDate: string,
  start: string,
  end: string,
): boolean {
  return transactionDate >= start && transactionDate <= end;
}

function sumRange(
  transactions: readonly DatedAmount[],
  start: string,
  end: string,
): { incomeMinor: number; expenseMinor: number; count: number } {
  let incomeMinor = 0;
  let expenseMinor = 0;
  let count = 0;

  for (const transaction of transactions) {
    if (!within(transaction.transaction_date, start, end)) continue;
    count += 1;
    if (transaction.type === "income") {
      incomeMinor += transaction.amount_minor;
    } else {
      expenseMinor += transaction.amount_minor;
    }
  }

  return { incomeMinor, expenseMinor, count };
}

/** Totals for the selected window and its previous comparison window. */
export function summarize(
  transactions: readonly DatedAmount[],
  window: DateWindow,
): Summary {
  const current = sumRange(transactions, window.start, window.end);
  const previous = sumRange(transactions, window.prevStart, window.prevEnd);

  return {
    incomeMinor: current.incomeMinor,
    expenseMinor: current.expenseMinor,
    netMinor: current.incomeMinor - current.expenseMinor,
    count: current.count,
    prevIncomeMinor: previous.incomeMinor,
    prevExpenseMinor: previous.expenseMinor,
    prevNetMinor: previous.incomeMinor - previous.expenseMinor,
    prevCount: previous.count,
  };
}

/* ------------------------------------------------------------------ */
/* Percentages (integer math, tenths of a percent)                     */
/* ------------------------------------------------------------------ */

/**
 * `(current - previous) / |previous|` in tenths of a percent, rounded with
 * integer arithmetic. Returns null when there is no previous baseline.
 * Values stay far inside Number.MAX_SAFE_INTEGER for realistic amounts
 * (the ×1000 factor only fits amounts under ~9 billion JOD).
 */
export function percentChangeX10(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  const delta = current - previous;
  return Math.round((delta * 1000) / Math.abs(previous));
}

/** "+12.3%" / "−4.5%" / "0.0%" from tenths of a percent. */
export function formatPercentX10(tenths: number | null): string | null {
  if (tenths === null) return null;
  const sign = tenths > 0 ? "+" : tenths < 0 ? "−" : "";
  const absolute = Math.abs(tenths);
  const whole = Math.trunc(absolute / 10);
  const tenth = absolute % 10;
  return `${sign}${whole}.${tenth}%`;
}

/** Share of a part out of a total, in tenths of a percent. */
export function shareX10(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part * 1000) / total);
}

/* ------------------------------------------------------------------ */
/* Chart buckets                                                       */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function bucketize<T extends { key: string; start: string; end: string }>(
  transactions: readonly DatedAmount[],
  windows: T[],
  labelFor: (entry: T, index: number) => string,
): PeriodBucket[] {
  return windows.map((entry, index) => {
    const totals = sumRange(transactions, entry.start, entry.end);
    return {
      key: entry.key,
      label: labelFor(entry, index),
      incomeMinor: totals.incomeMinor,
      expenseMinor: totals.expenseMinor,
    };
  });
}

/**
 * The `count` calendar months ending with the month that contains
 * `endIso`, oldest first. Labels include the year when the window spans
 * more than one calendar year.
 */
export function buildMonthBuckets(
  transactions: readonly DatedAmount[],
  endIso: string,
  count = 6,
): PeriodBucket[] {
  const end = parseIso(endIso);
  const entries: { key: string; start: string; end: string; year: number; month: number }[] =
    [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthStart = addMonths(startOfMonth(end), -offset);
    const monthEnd = endOfMonth(monthStart);
    entries.push({
      key: `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}`,
      start: toIso(monthStart),
      end: toIso(monthEnd),
      year: monthStart.getFullYear(),
      month: monthStart.getMonth(),
    });
  }

  const spansYears =
    entries.length > 0 && entries[0].year !== entries[entries.length - 1].year;

  return bucketize(
    transactions,
    entries,
    (entry) =>
      spansYears
        ? `${MONTH_LABELS[entry.month]} ’${String(entry.year).slice(2)}`
        : MONTH_LABELS[entry.month],
  );
}

/** The `count` calendar years ending with the year that contains `endIso`. */
export function buildYearBuckets(
  transactions: readonly DatedAmount[],
  endIso: string,
  count = 6,
): PeriodBucket[] {
  const endYear = parseIso(endIso).getFullYear();
  const entries: { key: string; start: string; end: string }[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const year = endYear - offset;
    entries.push({
      key: String(year),
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    });
  }

  return bucketize(transactions, entries, (entry) => entry.key);
}

/* ------------------------------------------------------------------ */
/* Expense breakdown                                                   */
/* ------------------------------------------------------------------ */

type ExpenseRow = DatedAmount & {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
};

/** Expense totals per category inside the window, largest first. */
export function buildExpenseBreakdown(
  transactions: readonly ExpenseRow[],
  window: Pick<DateWindow, "start" | "end">,
): { totalMinor: number; slices: ExpenseSlice[] } {
  const byCategory = new Map<
    number,
    { name: string; color: string; icon: string; amountMinor: number }
  >();
  let totalMinor = 0;

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    if (!within(transaction.transaction_date, window.start, window.end)) {
      continue;
    }

    totalMinor += transaction.amount_minor;
    const existing = byCategory.get(transaction.category_id);
    if (existing) {
      existing.amountMinor += transaction.amount_minor;
    } else {
      byCategory.set(transaction.category_id, {
        name: transaction.category_name,
        color: transaction.category_color,
        icon: transaction.category_icon,
        amountMinor: transaction.amount_minor,
      });
    }
  }

  const slices: ExpenseSlice[] = [...byCategory.entries()]
    .map(([categoryId, value]) => ({
      categoryId,
      ...value,
      shareX10: shareX10(value.amountMinor, totalMinor),
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);

  return { totalMinor, slices };
}

/* ------------------------------------------------------------------ */
/* Recent list                                                         */
/* ------------------------------------------------------------------ */

/** The latest `limit` transactions, defensively sorted newest first. */
export function recentTransactions<T extends DatedAmount & { id: number }>(
  transactions: readonly T[],
  limit = 10,
): T[] {
  return [...transactions]
    .sort(
      (a, b) =>
        b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id,
    )
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Compact axis formatting (display-only abbreviation)                 */
/* ------------------------------------------------------------------ */

/**
 * Abbreviates minor units for chart axis ticks, e.g. 1_500_500 → "1.5k"
 * (JOD). Derived with integer division; only axis labels are abbreviated,
 * never stored or reported values.
 */
export function formatMinorCompact(amountMinor: number): string {
  const major = Math.floor(amountMinor / 1000);
  const absolute = Math.abs(major);

  if (absolute >= 1_000_000_000) return `${Math.round(major / 1_000_000_000)}B`;
  if (absolute >= 1_000_000) return `${Math.round(major / 1_000_000)}M`;
  if (absolute >= 10_000) return `${Math.round(major / 1_000)}k`;
  if (absolute >= 1_000) {
    const tenths = Math.round((major * 10) / 1_000);
    return `${Math.trunc(tenths / 10)}.${tenths % 10}k`;
  }
  return String(major);
}
