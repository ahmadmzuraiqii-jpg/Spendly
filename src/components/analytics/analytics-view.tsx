"use client";

import { useMemo, useState } from "react";
import type { Currency } from "@/db/types";
import type { TransactionListItem } from "@/lib/supabase/queries";
import { CategoryAnalysisCard } from "@/components/analytics/category-analysis";
import { InsightsCard } from "@/components/analytics/insights";
import { NetChart } from "@/components/analytics/net-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import {
  analyzeCategories,
  buildInsights,
} from "@/lib/analytics";
import {
  buildMonthBuckets,
  defaultCustomRange,
  resolveRange,
  summarize,
  type RangeId,
} from "@/lib/dashboard";

type AnalyticsViewProps = {
  transactions: TransactionListItem[];
  currency: Currency;
  /** Local "today" supplied by the server page (no `new Date()` here). */
  today: string;
};

/**
 * Client-side analytics: the date-range state lives here so every summary,
 * chart, and observation recomputes instantly without a round trip. All of
 * the maths runs through `src/lib/dashboard.ts` and `src/lib/analytics.ts`,
 * which keep money in integer minor units.
 */
export function AnalyticsView({
  transactions,
  currency,
  today,
}: AnalyticsViewProps) {
  const [rangeId, setRangeId] = useState<RangeId>("this-month");
  const [custom, setCustom] = useState(() => defaultCustomRange(today));
  const [months, setMonths] = useState<number>(12);

  const dateWindow = useMemo(
    () => resolveRange(rangeId, custom, today),
    [rangeId, custom, today],
  );
  const summary = useMemo(
    () => summarize(transactions, dateWindow),
    [transactions, dateWindow],
  );
  const buckets = useMemo(
    () => buildMonthBuckets(transactions, dateWindow.end, months),
    [transactions, dateWindow.end, months],
  );
  const category = useMemo(
    () => analyzeCategories(transactions, dateWindow),
    [transactions, dateWindow],
  );
  const insights = useMemo(
    () => buildInsights({ transactions, window: dateWindow, currency }),
    [transactions, dateWindow, currency],
  );

  function handleRangeChange(next: RangeId) {
    if (next === "custom") {
      setCustom(defaultCustomRange(today));
    }
    setRangeId(next);
  }

  return (
    <div className="space-y-6">
      <RangeFilter
        value={rangeId}
        customFrom={custom.from}
        customTo={custom.to}
        onChange={handleRangeChange}
        onCustomFromChange={(value) =>
          setCustom((current) => ({ ...current, from: value }))
        }
        onCustomToChange={(value) =>
          setCustom((current) => ({ ...current, to: value }))
        }
      />

      <SummaryCards
        summary={summary}
        currency={currency}
        prevLabel={dateWindow.prevLabel}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <TrendChart
          className="lg:col-span-3"
          buckets={buckets}
          currency={currency}
          months={months}
          onMonthsChange={setMonths}
        />
        <NetChart className="lg:col-span-2" buckets={buckets} currency={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <CategoryAnalysisCard
          className="lg:col-span-3"
          analysis={category}
          window={dateWindow}
          currency={currency}
        />
        <InsightsCard className="lg:col-span-2" insights={insights} />
      </div>
    </div>
  );
}
