"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import type { Currency } from "@/db/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildExpenseBreakdown,
  formatPercentX10,
  type DateWindow,
  type ExpenseSlice,
} from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type TransactionRow = {
  transaction_date: string;
  type: "income" | "expense";
  amount_minor: number;
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
};

function BreakdownTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ExpenseSlice }>;
  currency?: Currency;
}) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice || !currency) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-popover">
      <p className="mb-1 font-semibold text-foreground">{slice.name}</p>
      <p className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Amount</span>
        <span className="font-medium tabular-nums text-foreground">
          {formatMoney(slice.amountMinor, currency)}
        </span>
      </p>
      <p className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Share</span>
        <span className="font-medium tabular-nums text-foreground">
          {formatPercentX10(slice.shareX10)?.replace("+", "") ?? "0.0%"}
        </span>
      </p>
    </div>
  );
}

function formatShare(tenths: number): string {
  return formatPercentX10(tenths)?.replace("+", "") ?? "0.0%";
}

type ExpenseBreakdownProps = {
  transactions: readonly TransactionRow[];
  window: Pick<DateWindow, "start" | "end" | "label">;
  currency: Currency;
  className?: string;
};

/**
 * Doughnut chart of how the selected window's expenses split across
 * categories. Clicking a slice or a legend row opens the transaction list
 * filtered to that category. Slice colors are the categories' saved hex
 * colors, which read well on both light and dark surfaces.
 */
export function ExpenseBreakdown({
  transactions,
  window,
  currency,
  className,
}: ExpenseBreakdownProps) {
  const router = useRouter();
  const { totalMinor, slices } = useMemo(
    () => buildExpenseBreakdown(transactions, window),
    [transactions, window],
  );

  function openCategory(categoryId: number) {
    router.push(`/transactions?category=${categoryId}`);
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Expense breakdown</CardTitle>
        <CardDescription>By category · {window.label}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {totalMinor > 0 && slices.length > 0 ? (
          <div className="grid items-center gap-5 sm:grid-cols-2">
            <div className="relative mx-auto h-[210px] w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amountMinor"
                    nameKey="name"
                    innerRadius="64%"
                    outerRadius="94%"
                    paddingAngle={2}
                    stroke="var(--card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                    onClick={(entry) => {
                      const categoryId = (
                        entry as { categoryId?: number } | null
                      )?.categoryId;
                      if (typeof categoryId === "number") {
                        openCategory(categoryId);
                      }
                    }}
                  >
                    {slices.map((slice) => (
                      <Cell
                        key={slice.categoryId}
                        fill={slice.color}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<BreakdownTooltip currency={currency} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.01em] tabular-nums text-foreground">
                    {formatMoney(totalMinor, currency)}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Expenses
                  </p>
                </div>
              </div>
            </div>

            <ul className="max-h-[210px] space-y-1 overflow-y-auto pr-1">
              {slices.map((slice) => (
                <li key={slice.categoryId}>
                  <Link
                    href={`/transactions?category=${slice.categoryId}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {slice.name}
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      {formatMoney(slice.amountMinor, currency)}
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatShare(slice.shareX10)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={PieChartIcon}
            title="No expenses in this period"
            description="Add an expense or pick a different date range to see the category breakdown."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}

// Re-exported for the dashboard view's type imports.
export type { ExpenseSlice };
