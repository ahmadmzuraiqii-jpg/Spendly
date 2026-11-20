"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Currency } from "@/db/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildMonthBuckets,
  buildYearBuckets,
  formatMinorCompact,
} from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

type TransactionRow = {
  transaction_date: string;
  type: "income" | "expense";
  amount_minor: number;
};

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-popover">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((entry, index) => {
        const isIncome = entry.dataKey === "incomeMinor";
        return (
          <p
            key={index}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  "size-2 rounded-sm",
                  isIncome ? "bg-income" : "bg-expense",
                )}
                aria-hidden="true"
              />
              {isIncome ? "Income" : "Expense"}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatMoney(Number(entry.value ?? 0), currency)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

const VIEWS = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

type IncomeExpenseChartProps = {
  transactions: readonly TransactionRow[];
  windowEnd: string;
  windowLabel: string;
  currency: Currency;
  className?: string;
};

/**
 * Grouped bar chart of income vs expenses. The monthly view shows the six
 * calendar months ending at the selected window's end; the yearly view
 * shows the six calendar years. Series colors come from the design
 * system's `--income` / `--expense` tokens, so the chart follows light
 * and dark mode automatically.
 */
export function IncomeExpenseChart({
  transactions,
  windowEnd,
  windowLabel,
  currency,
  className,
}: IncomeExpenseChartProps) {
  const [view, setView] = useState<ViewId>("monthly");

  const buckets = useMemo(
    () =>
      view === "monthly"
        ? buildMonthBuckets(transactions, windowEnd)
        : buildYearBuckets(transactions, windowEnd),
    [transactions, view, windowEnd],
  );

  const hasData = buckets.some(
    (bucket) => bucket.incomeMinor > 0 || bucket.expenseMinor > 0,
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Income vs expenses</CardTitle>
          <CardDescription>
            {view === "monthly" ? "Last 6 months" : "Last 6 years"} ·{" "}
            {windowLabel}
          </CardDescription>
        </div>
        <div
          role="group"
          aria-label="Chart period"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
        >
          {VIEWS.map((option) => {
            const active = view === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setView(option.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {hasData ? (
          <>
            <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm bg-income"
                  aria-hidden="true"
                />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm bg-expense"
                  aria-hidden="true"
                />
                Expense
              </span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buckets}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  barGap={4}
                  barCategoryGap="26%"
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                    }}
                    dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                    }}
                    tickFormatter={(value: number) =>
                      formatMinorCompact(Number(value))
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip currency={currency} />}
                    cursor={{ fill: "var(--muted)", fillOpacity: 0.6 }}
                  />
                  <Bar
                    dataKey="incomeMinor"
                    name="Income"
                    fill="var(--income)"
                    maxBarSize={26}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="expenseMinor"
                    name="Expense"
                    fill="var(--expense)"
                    maxBarSize={26}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No income or expenses here"
            description={`Nothing was recorded in the ${windowLabel.toLowerCase()} window. Pick another range to see your trends.`}
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}
