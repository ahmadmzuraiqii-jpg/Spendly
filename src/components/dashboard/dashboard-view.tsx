"use client";

import { useMemo, useState } from "react";
import type { Currency } from "@/db/types";
import type { TransactionListItem } from "@/lib/supabase/queries";
import { ExpenseBreakdown } from "@/components/dashboard/expense-breakdown";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import {
  defaultCustomRange,
  recentTransactions,
  resolveRange,
  summarize,
  type RangeId,
} from "@/lib/dashboard";

type DashboardViewProps = {
  transactions: TransactionListItem[];
  currency: Currency;
  /** Local "today" supplied by the server page (no `new Date()` here). */
  today: string;
};

/**
 * Client-side dashboard: the date-range state lives here so switching a
 * preset recomputes cards, charts and breakdowns instantly without a round
 * trip. All aggregation goes through `src/lib/dashboard.ts`, which keeps
 * money in integer minor units.
 */
export function DashboardView({ transactions, currency, today }: DashboardViewProps) {
  const [rangeId, setRangeId] = useState<RangeId>("this-month");
  const [custom, setCustom] = useState(() => defaultCustomRange(today));

  const dateWindow = useMemo(
    () => resolveRange(rangeId, custom, today),
    [rangeId, custom, today],
  );
  const summary = useMemo(
    () => summarize(transactions, dateWindow),
    [transactions, dateWindow],
  );
  const recent = useMemo(
    () => recentTransactions(transactions, 10),
    [transactions],
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
        <IncomeExpenseChart
          className="lg:col-span-3"
          transactions={transactions}
          windowEnd={dateWindow.end}
          windowLabel={dateWindow.label}
          currency={currency}
        />
        <ExpenseBreakdown
          className="lg:col-span-2"
          transactions={transactions}
          window={dateWindow}
          currency={currency}
        />
      </div>

      <RecentTransactions items={recent} currency={currency} />
    </div>
  );
}
