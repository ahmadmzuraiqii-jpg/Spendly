import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  ReceiptText,
} from "lucide-react";
import type { Currency } from "@/db/types";
import type { TransactionListItem } from "@/lib/supabase/queries";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/dates";
import { formatSignedMoney } from "@/lib/money";
import {
  CATEGORY_ICONS,
  type CategoryIconSlug,
} from "@/lib/category-icons";
import { CircleEllipsis } from "lucide-react";
import { cn } from "@/lib/utils";

function CategoryChip({
  name,
  color,
  icon,
}: {
  name: string;
  color: string;
  icon: string;
}) {
  const Icon = CATEGORY_ICONS[icon as CategoryIconSlug] ?? CircleEllipsis;

  return (
    <span
      className="inline-flex max-w-full items-center gap-2 text-sm text-foreground"
      title={name}
    >
      <span
        className="grid size-6 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: `${color}26`, color }}
        aria-hidden="true"
      >
        <Icon className="size-3.5" />
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

function TypeBadge({ type }: { type: "income" | "expense" }) {
  return (
    <Badge variant={type}>
      {type === "income" ? (
        <ArrowUpRight className="size-3" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden="true" />
      )}
      {type === "income" ? "Income" : "Expense"}
    </Badge>
  );
}

function Amount({
  transaction,
  currency,
  className,
}: {
  transaction: TransactionListItem;
  currency: Currency;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        transaction.type === "income" ? "text-income" : "text-expense",
        className,
      )}
    >
      {formatSignedMoney(transaction.amount_minor, transaction.type, currency)}
    </span>
  );
}

function EditLink({ transaction }: { transaction: TransactionListItem }) {
  return (
    <Link
      href={`/transactions/${transaction.id}/edit`}
      aria-label={`Edit ${transaction.description}`}
      title="Edit"
      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Pencil className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function TransactionList({
  items,
  currency,
}: {
  items: TransactionListItem[];
  currency: Currency;
}) {
  return (
    <>
      {/* Desktop: full table. The card scrolls horizontally when six columns
          don't fit the content column (roughly 640–1130px viewports) instead
          of letting the page itself overflow. `relative` anchors sr-only
          spans (the Actions header) so they scroll with — and are clipped by
          — the card instead of escaping to the document. */}
      <div className="relative hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3">
                Category
              </th>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="max-w-[16rem] px-4 py-3.5">
                  <p className="truncate font-medium text-foreground">
                    {transaction.description}
                  </p>
                  {transaction.merchant ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {transaction.merchant}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3.5">
                  <CategoryChip
                    name={transaction.category_name}
                    color={transaction.category_color}
                    icon={transaction.category_icon}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted-foreground">
                  {formatDisplayDate(transaction.transaction_date)}
                </td>
                <td className="px-4 py-3.5">
                  <TypeBadge type={transaction.type} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">
                  <Amount transaction={transaction} currency={currency} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <EditLink transaction={transaction} />
                    <DeleteTransactionButton
                      id={transaction.id}
                      description={transaction.description}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {items.map((transaction) => (
          <div
            key={transaction.id}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {transaction.description}
                </p>
                {transaction.merchant ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {transaction.merchant}
                  </p>
                ) : null}
              </div>
              <Amount
                transaction={transaction}
                currency={currency}
                className="shrink-0 text-sm font-semibold"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CategoryChip
                name={transaction.category_name}
                color={transaction.category_color}
                icon={transaction.category_icon}
              />
              <TypeBadge type={transaction.type} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                {formatDisplayDate(transaction.transaction_date)}
              </span>
              <div className="flex items-center gap-1">
                <EditLink transaction={transaction} />
                <DeleteTransactionButton
                  id={transaction.id}
                  description={transaction.description}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function TransactionListEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border">
        <ReceiptText className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        No transactions yet
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Add your first income or expense and it will show up here, saved
        locally in SQLite.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/transactions/new?type=expense"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Add expense
        </Link>
        <Link
          href="/transactions/new?type=income"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Add income
        </Link>
      </div>
    </div>
  );
}
