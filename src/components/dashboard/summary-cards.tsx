"use client";

import { ArrowDownRight, ArrowUpRight, ReceiptText, Wallet } from "lucide-react";
import type { Currency } from "@/db/types";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import {
  formatPercentX10,
  percentChangeX10,
  type Summary,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

type Polarity = "up-is-good" | "down-is-good" | "neutral";

function Delta({
  current,
  previous,
  prevLabel,
  polarity,
}: {
  current: number;
  previous: number;
  prevLabel: string;
  polarity: Polarity;
}) {
  const tenths = percentChangeX10(current, previous);
  const text = formatPercentX10(tenths);

  const tone =
    tenths === null || tenths === 0 || polarity === "neutral"
      ? "text-muted-foreground"
      : (polarity === "up-is-good") === (tenths > 0)
        ? "text-income"
        : "text-expense";

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-1 text-xs font-medium",
        tone,
      )}
    >
      {tenths !== null && tenths !== 0 ? (
        tenths > 0 ? (
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="size-3.5" aria-hidden="true" />
        )
      ) : null}
      {text ? <span className="tabular-nums">{text}</span> : null}
      <span className="font-normal text-muted-foreground">{prevLabel}</span>
    </span>
  );
}

type SummaryCardsProps = {
  summary: Summary;
  currency: Currency;
  prevLabel: string;
};

export function SummaryCards({ summary, currency, prevLabel }: SummaryCardsProps) {
  const cards: {
    key: string;
    label: string;
    value: string;
    valueClassName: string;
    icon: typeof Wallet;
    iconClassName: string;
    current: number;
    previous: number;
    polarity: Polarity;
  }[] = [
    {
      key: "income",
      label: "Total Income",
      value: formatMoney(summary.incomeMinor, currency),
      valueClassName: "text-income",
      icon: ArrowUpRight,
      iconClassName: "bg-income/10 text-income",
      current: summary.incomeMinor,
      previous: summary.prevIncomeMinor,
      polarity: "up-is-good",
    },
    {
      key: "expense",
      label: "Total Expenses",
      value: formatMoney(summary.expenseMinor, currency),
      valueClassName: "text-expense",
      icon: ArrowDownRight,
      iconClassName: "bg-expense/10 text-expense",
      current: summary.expenseMinor,
      previous: summary.prevExpenseMinor,
      polarity: "down-is-good",
    },
    {
      key: "net",
      label: "Net Balance",
      value: formatMoney(summary.netMinor, currency),
      valueClassName:
        summary.netMinor > 0
          ? "text-income"
          : summary.netMinor < 0
            ? "text-expense"
            : "text-foreground",
      icon: Wallet,
      iconClassName: "bg-accent text-accent-foreground",
      current: summary.netMinor,
      previous: summary.prevNetMinor,
      polarity: "up-is-good",
    },
    {
      key: "count",
      label: "Total Transactions",
      value: String(summary.count),
      valueClassName: "text-foreground",
      icon: ReceiptText,
      iconClassName: "bg-secondary text-secondary-foreground",
      current: summary.count,
      previous: summary.prevCount,
      polarity: "neutral",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {card.label}
              </span>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg",
                  card.iconClassName,
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-semibold tracking-[-0.02em] tabular-nums",
                card.valueClassName,
              )}
            >
              {card.value}
            </p>
            <div className="mt-2">
              <Delta
                current={card.current}
                previous={card.previous}
                prevLabel={prevLabel}
                polarity={card.polarity}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
