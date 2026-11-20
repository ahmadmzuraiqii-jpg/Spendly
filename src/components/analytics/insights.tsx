"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarDays,
  PieChart,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Insight } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  "spending-up": TrendingUp,
  "spending-down": TrendingDown,
  "spending-flat": Wallet,
  "spending-start": ReceiptText,
  "net-positive": Wallet,
  "net-negative": TrendingDown,
  "largest-category": PieChart,
  "smallest-category": PieChart,
  "category-mover": ArrowLeftRight,
  "peak-month": CalendarDays,
  "streak-up": TrendingUp,
  "streak-down": TrendingDown,
  "top-three": PieChart,
};

const TONE_CLASSES: Record<Insight["tone"], string> = {
  positive: "bg-income/10 text-income",
  negative: "bg-expense/10 text-expense",
  neutral: "bg-accent/15 text-accent-strong",
};

type InsightsCardProps = {
  insights: Insight[];
  className?: string;
};

/**
 * Rule-based observations produced by `src/lib/analytics.ts` — simple
 * arithmetic and conditional statements over the SQLite rows, never an
 * external model. Each row states a number the user can verify against the
 * cards and charts on the same page.
 */
export function InsightsCard({ insights, className }: InsightsCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>Calculated from your transactions</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {insights.length > 0 ? (
          <ul className="space-y-4">
            {insights.map((insight) => {
              const Icon = INSIGHT_ICONS[insight.id] ?? Sparkles;
              return (
                <li key={insight.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      TONE_CLASSES[insight.tone],
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <p className="pt-1 text-sm leading-6 text-muted-foreground">
                    {insight.text}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Not enough data yet"
            description="Insights appear once this period has income or expenses to compare."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  );
}
