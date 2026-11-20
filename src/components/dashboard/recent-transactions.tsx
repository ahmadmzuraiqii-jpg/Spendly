import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Currency } from "@/db/types";
import type { TransactionListItem } from "@/lib/supabase/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionListEmpty } from "@/components/transaction-list";
import { formatDisplayDate } from "@/lib/dates";
import { formatSignedMoney } from "@/lib/money";
import { CATEGORY_ICONS, type CategoryIconSlug } from "@/lib/category-icons";
import { CircleEllipsis } from "lucide-react";
import { cn } from "@/lib/utils";

function RecentRow({
  transaction,
  currency,
}: {
  transaction: TransactionListItem;
  currency: Currency;
}) {
  const Icon =
    CATEGORY_ICONS[transaction.category_icon as CategoryIconSlug] ??
    CircleEllipsis;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-lg"
        style={{
          backgroundColor: `${transaction.category_color}26`,
          color: transaction.category_color,
        }}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.description}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {transaction.category_name} ·{" "}
          {formatDisplayDate(transaction.transaction_date)}
        </p>
      </div>

      <Badge
        variant={transaction.type}
        className="shrink-0 max-[430px]:hidden"
      >
        {transaction.type === "income" ? (
          <ArrowUpRight className="size-3" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="size-3" aria-hidden="true" />
        )}
        {transaction.type === "income" ? "Income" : "Expense"}
      </Badge>

      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          transaction.type === "income" ? "text-income" : "text-expense",
        )}
      >
        {formatSignedMoney(transaction.amount_minor, transaction.type, currency)}
      </span>
    </li>
  );
}

type RecentTransactionsProps = {
  items: TransactionListItem[];
  currency: Currency;
};

/** Latest entries (newest first) with a link through to the full list. */
export function RecentTransactions({ items, currency }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Recent transactions</CardTitle>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent-strong outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="divide-y divide-border">
            {items.map((transaction) => (
              <RecentRow
                key={transaction.id}
                transaction={transaction}
                currency={currency}
              />
            ))}
          </ul>
        ) : (
          <TransactionListEmpty />
        )}
      </CardContent>
    </Card>
  );
}
