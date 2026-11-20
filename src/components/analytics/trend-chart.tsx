"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { Currency } from "@/db/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/income-expense-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMinorCompact, type PeriodBucket } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const SPANS = [
  { months: 12, label: "12 months" },
  { months: 24, label: "24 months" },
] as const;

type TrendChartProps = {
  buckets: PeriodBucket[];
  currency: Currency;
  months: number;
  onMonthsChange: (months: number) => void;
  className?: string;
};

/**
 * Income and expense trends over longer periods than the dashboard's
 * six-month view. Lines keep overlapping months readable, and both series use
 * the `--income` / `--expense` design tokens so they follow light/dark mode
 * with no JavaScript.
 */
export function TrendChart({
  buckets,
  currency,
  months,
  onMonthsChange,
  className,
}: TrendChartProps) {
  const hasData = buckets.some(
    (bucket) => bucket.incomeMinor > 0 || bucket.expenseMinor > 0,
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Spending trends</CardTitle>
          <CardDescription>Income vs expenses, last {months} months</CardDescription>
        </div>
        <div
          role="group"
          aria-label="Trend period"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
        >
          {SPANS.map((span) => {
            const active = months === span.months;
            return (
              <button
                key={span.months}
                type="button"
                aria-pressed={active}
                onClick={() => onMonthsChange(span.months)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {span.label}
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
                <span className="size-2.5 rounded-sm bg-income" aria-hidden="true" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-expense" aria-hidden="true" />
                Expense
              </span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={buckets}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
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
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    dy={8}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(value: number) =>
                      formatMinorCompact(Number(value))
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip currency={currency} />}
                    cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incomeMinor"
                    name="Income"
                    stroke="var(--income)"
                    strokeWidth={2}
                    dot={{ fill: "var(--income)", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenseMinor"
                    name="Expense"
                    stroke="var(--expense)"
                    strokeWidth={2}
                    dot={{ fill: "var(--expense)", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No trends to show yet"
            description="Once income or expenses are recorded they appear here as a monthly trend."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}
