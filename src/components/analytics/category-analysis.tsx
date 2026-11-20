"use client";

import { ArrowDownRight, ArrowUpRight, PieChart } from "lucide-react";
import type { Currency } from "@/db/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DateWindow } from "@/lib/dashboard";
import { formatShareX10, type CategoryAnalysis } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

function Highlight({
  label,
  name,
  amountMinor,
  shareX10,
  color,
  icon,
  iconClassName,
  currency,
}: {
  label: string;
  name: string;
  amountMinor: number;
  shareX10: number;
  color: string;
  icon: typeof ArrowUpRight;
  iconClassName: string;
  currency: Currency;
}) {
  const Icon = icon;

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg",
            iconClassName,
          )}
          aria-hidden="true"
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-[-0.02em] tabular-nums text-foreground">
        {formatMoney(amountMinor, currency)}
        <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">
          {formatShareX10(shareX10)}
        </span>
      </p>
    </div>
  );
}

type CategoryAnalysisCardProps = {
  analysis: CategoryAnalysis;
  window: Pick<DateWindow, "label">;
  currency: Currency;
  className?: string;
};

/**
 * Where the period's money went: the highest and lowest spending categories
 * up front, then every expense category with its total, share of spending,
 * and a proportional bar. Shares come from `shareX10` (integer tenths of a
 * percent), so the listed percentages are rounded exactly once.
 */
export function CategoryAnalysisCard({
  analysis,
  window,
  currency,
  className,
}: CategoryAnalysisCardProps) {
  const { slices, totalMinor, highest, lowest } = analysis;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Category analysis</CardTitle>
        <CardDescription>
          Share of spending · {window.label}
          {totalMinor > 0 ? ` · ${formatMoney(totalMinor, currency)} total` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {highest && lowest ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Highlight
                label="Highest spending category"
                name={highest.name}
                amountMinor={highest.amountMinor}
                shareX10={highest.shareX10}
                color={highest.color}
                icon={ArrowUpRight}
                iconClassName="bg-expense/10 text-expense"
                currency={currency}
              />
              <Highlight
                label="Lowest spending category"
                name={lowest.name}
                amountMinor={lowest.amountMinor}
                shareX10={lowest.shareX10}
                color={lowest.color}
                icon={ArrowDownRight}
                iconClassName="bg-income/10 text-income"
                currency={currency}
              />
            </div>

            <ul className="space-y-3.5">
              {slices.map((slice) => (
                <li key={slice.categoryId} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
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
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatShareX10(slice.shareX10)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, slice.shareX10 / 10)}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={PieChart}
            title="No expenses in this period"
            description="Pick a different date range or add an expense to analyse your categories."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}
