"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Scale } from "lucide-react";
import type { Currency } from "@/db/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMinorCompact, type PeriodBucket } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type NetBucket = PeriodBucket & { netMinor: number };

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string;
};

function NetTooltip({
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

  const net = Number(payload[0]?.value ?? 0);

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-popover">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Net</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            net > 0 ? "text-income" : net < 0 ? "text-expense" : "text-foreground",
          )}
        >
          {formatMoney(net, currency)}
        </span>
      </p>
    </div>
  );
}

type NetChartProps = {
  buckets: PeriodBucket[];
  currency: Currency;
  className?: string;
};

/**
 * Monthly net (income − expenses) as signed bars: green months saved money,
 * red months spent more than they earned. All arithmetic happens upstream in
 * integer minor units; this component only draws the result.
 */
export function NetChart({ buckets, currency, className }: NetChartProps) {
  const data: NetBucket[] = buckets.map((bucket) => ({
    ...bucket,
    netMinor: bucket.incomeMinor - bucket.expenseMinor,
  }));
  const hasData = data.some(
    (bucket) => bucket.incomeMinor > 0 || bucket.expenseMinor > 0,
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Monthly net</CardTitle>
        <CardDescription>Income minus expenses per month</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {hasData ? (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="30%"
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
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value: number) =>
                    formatMinorCompact(Number(value))
                  }
                />
                <Tooltip
                  content={<NetTooltip currency={currency} />}
                  cursor={{ fill: "var(--muted)", fillOpacity: 0.6 }}
                />
                <Bar
                  dataKey="netMinor"
                  name="Net"
                  maxBarSize={26}
                  radius={[4, 4, 4, 4]}
                  isAnimationActive={false}
                >
                  {data.map((bucket) => (
                    <Cell
                      key={bucket.key}
                      fill={bucket.netMinor < 0 ? "var(--expense)" : "var(--income)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Scale}
            title="No net trend yet"
            description="Record an income or an expense to start seeing your monthly net."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}
