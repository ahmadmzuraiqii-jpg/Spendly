/**
 * Pure, rule-based analytics for the Analytics page (Phase 4).
 *
 * Everything here is plain arithmetic over integer minor units (1 JOD = 1000)
 * plus conditional statements — no external services and no AI. Percentages
 * are produced by the shared helpers in `src/lib/dashboard.ts` and are kept in
 * tenths of a percent so a single rounding happens when a sentence is
 * rendered. Text is assembled here only from values read from SQLite, so an
 * observation can always be traced back to the numbers on screen.
 */
import type { Currency } from "@/db/types";
import {
  buildExpenseBreakdown,
  buildMonthBuckets,
  percentChangeX10,
  shareX10,
  summarize,
  type DateWindow,
  type ExpenseSlice,
} from "@/lib/dashboard";
import { formatMoney, MINOR_UNITS_PER_MAJOR } from "@/lib/money";

export type AnalyticsRow = {
  transaction_date: string;
  type: "income" | "expense";
  amount_minor: number;
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
};

export type InsightTone = "positive" | "negative" | "neutral";

export type Insight = {
  id: string;
  tone: InsightTone;
  text: string;
};

export type CategoryAnalysis = {
  totalMinor: number;
  slices: ExpenseSlice[];
  highest: ExpenseSlice | null;
  lowest: ExpenseSlice | null;
};

/* ------------------------------------------------------------------ */
/* Presentation helpers (display only — never stored)                  */
/* ------------------------------------------------------------------ */

/** "15.0%" / "2.5%" from tenths of a percent, without a sign. */
function plainPercent(tenths: number): string {
  const absolute = Math.abs(tenths);
  return `${Math.trunc(absolute / 10)}.${absolute % 10}%`;
}

/**
 * Share of a total as a display percentage (tenths of a percent → "71.6%").
 * Exported for the category list, which needs the same rounding as insights.
 */
export function formatShareX10(tenths: number): string {
  return `${Math.trunc(tenths / 10)}.${tenths % 10}%`;
}

/**
 * "vs last month" → "last month", "vs previous 3 months" → "the previous 3
 * months", so sentences read naturally for every range preset.
 */
function periodPhrase(prevLabel: string): string {
  const raw = prevLabel.replace(/^vs\s+/, "");
  return raw.startsWith("previous") ? `the ${raw}` : raw;
}

/* ------------------------------------------------------------------ */
/* Category analysis                                                   */
/* ------------------------------------------------------------------ */

/**
 * Expense totals for the window with the highest and lowest spending
 * categories. `buildExpenseBreakdown` only lists categories that actually
 * have expenses in the window and sorts them largest first, so the extremes
 * are the ends of that list.
 */
export function analyzeCategories(
  transactions: readonly AnalyticsRow[],
  window: Pick<DateWindow, "start" | "end">,
): CategoryAnalysis {
  const { totalMinor, slices } = buildExpenseBreakdown(transactions, window);

  return {
    totalMinor,
    slices,
    highest: slices.length > 0 ? slices[0] : null,
    lowest: slices.length > 0 ? slices[slices.length - 1] : null,
  };
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

/**
 * Rule-based observations about the selected window. Each rule fires only
 * when its numbers support the sentence, and comparisons use the window's own
 * previous period (the same one the summary cards compare against).
 */
export function buildInsights(input: {
  transactions: readonly AnalyticsRow[];
  window: DateWindow;
  currency: Currency;
}): Insight[] {
  const { transactions, window, currency } = input;
  const summary = summarize(transactions, window);
  const current = buildExpenseBreakdown(transactions, window);
  const previous = buildExpenseBreakdown(transactions, {
    start: window.prevStart,
    end: window.prevEnd,
  });
  const period = periodPhrase(window.prevLabel);

  const insights: Insight[] = [];

  /* 1. Overall spending vs the previous period. */
  if (summary.expenseMinor > 0) {
    if (summary.prevExpenseMinor === 0) {
      insights.push({
        id: "spending-start",
        tone: "neutral",
        text: `No expenses were recorded in the ${period}; this period you spent ${formatMoney(summary.expenseMinor, currency)}.`,
      });
    } else {
      const changeX10 = percentChangeX10(
        summary.expenseMinor,
        summary.prevExpenseMinor,
      );

      if (changeX10 === null || Math.abs(changeX10) < 10) {
        insights.push({
          id: "spending-flat",
          tone: "neutral",
          text: `Spending is about the same as ${period} (${plainPercent(changeX10 ?? 0)}).`,
        });
      } else {
        insights.push({
          id: changeX10 > 0 ? "spending-up" : "spending-down",
          tone: changeX10 > 0 ? "negative" : "positive",
          text: `Your spending ${changeX10 > 0 ? "increased" : "decreased"} by ${plainPercent(changeX10)} compared with ${period}.`,
        });
      }
    }
  }

  /* 2. Net position: what was kept, or by how much spending ran ahead. */
  if (summary.incomeMinor > 0) {
    if (summary.netMinor < 0) {
      insights.push({
        id: "net-negative",
        tone: "negative",
        text: `Expenses exceeded your income by ${formatMoney(-summary.netMinor, currency)} this period.`,
      });
    } else if (summary.netMinor > 0) {
      insights.push({
        id: "net-positive",
        tone: "positive",
        text: `You kept ${plainPercent(shareX10(summary.netMinor, summary.incomeMinor))} of your income this period.`,
      });
    }
  }

  /* 3. Largest expense category. */
  const highest = current.slices[0];
  if (highest) {
    insights.push({
      id: "largest-category",
      tone: "neutral",
      text: `${highest.name} is your largest expense category (${plainPercent(highest.shareX10)} of your spending).`,
    });
  }

  /* 4. Biggest single-category change vs the previous period. */
  const previousById = new Map(
    previous.slices.map((slice) => [slice.categoryId, slice.amountMinor]),
  );
  const currentById = new Map(
    current.slices.map((slice) => [slice.categoryId, slice.amountMinor]),
  );

  let mover: { name: string; deltaMinor: number } | null = null;

  const consider = (name: string, deltaMinor: number) => {
    if (Math.abs(deltaMinor) < MINOR_UNITS_PER_MAJOR) return; // under 1 JOD
    if (!mover || Math.abs(deltaMinor) > Math.abs(mover.deltaMinor)) {
      mover = { name, deltaMinor };
    }
  };

  for (const slice of current.slices) {
    const before = previousById.get(slice.categoryId);
    if (before === undefined) continue;
    consider(slice.name, slice.amountMinor - before);
  }
  for (const slice of previous.slices) {
    if (currentById.has(slice.categoryId)) continue;
    consider(slice.name, -slice.amountMinor);
  }

  if (mover) {
    const { name, deltaMinor } = mover;
    insights.push({
      id: "category-mover",
      tone: deltaMinor < 0 ? "positive" : "negative",
      text: `You spent ${formatMoney(Math.abs(deltaMinor), currency)} ${deltaMinor < 0 ? "less" : "more"} on ${name} than ${period}.`,
    });
  }

  /* 5. Most expensive month of the last year. */
  const yearBuckets = buildMonthBuckets(transactions, window.end, 12);
  const busiest = yearBuckets.reduce<{ label: string; expenseMinor: number } | null>(
    (best, bucket) =>
      bucket.expenseMinor > 0 &&
      (best === null || bucket.expenseMinor > best.expenseMinor)
        ? { label: bucket.label, expenseMinor: bucket.expenseMinor }
        : best,
    null,
  );
  if (busiest && busiest.expenseMinor > 0) {
    insights.push({
      id: "peak-month",
      tone: "neutral",
      text: `${busiest.label} was your most expensive month of the last year at ${formatMoney(busiest.expenseMinor, currency)}.`,
    });
  }

  /* 6. Three-month spending streak (the last three months up to the window). */
  const recent = buildMonthBuckets(transactions, window.end, 3);
  if (recent.length === 3 && recent[0].expenseMinor > 0) {
    const rising =
      recent[0].expenseMinor < recent[1].expenseMinor &&
      recent[1].expenseMinor < recent[2].expenseMinor;
    const falling =
      recent[0].expenseMinor > recent[1].expenseMinor &&
      recent[1].expenseMinor > recent[2].expenseMinor;

    if (rising) {
      insights.push({
        id: "streak-up",
        tone: "negative",
        text: "Your spending has risen for three months in a row.",
      });
    } else if (falling) {
      insights.push({
        id: "streak-down",
        tone: "positive",
        text: "Your spending has fallen for three months in a row.",
      });
    }
  }

  /* 7. Smallest expense category (only meaningful with more than one). */
  const lowest = current.slices.length > 1 ? current.slices[current.slices.length - 1] : null;
  if (lowest) {
    insights.push({
      id: "smallest-category",
      tone: "neutral",
      text: `${lowest.name} is your smallest expense category at ${formatMoney(lowest.amountMinor, currency)}.`,
    });
  }

  /* 8. Concentration: how much of the spending sits in the top three. */
  if (current.slices.length >= 3 && current.totalMinor > 0) {
    const topThree = current.slices
      .slice(0, 3)
      .reduce((total, slice) => total + slice.amountMinor, 0);
    insights.push({
      id: "top-three",
      tone: "neutral",
      text: `Your three biggest categories account for ${plainPercent(shareX10(topThree, current.totalMinor))} of your spending.`,
    });
  }

  /**
   * Keep the card readable: order the rules by usefulness (the trend of the
   * selected period first, concentration last) and take the first six. Sorting
   * is stable, so equally ranked rules keep the order they were generated in.
   */
  const PRIORITY: string[] = [
    "spending-up",
    "spending-down",
    "spending-flat",
    "spending-start",
    "streak-up",
    "streak-down",
    "net-negative",
    "net-positive",
    "largest-category",
    "category-mover",
    "smallest-category",
    "peak-month",
    "top-three",
  ];

  return insights
    .slice()
    .sort((a, b) => PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id))
    .slice(0, 6);
}
