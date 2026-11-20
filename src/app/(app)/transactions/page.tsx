import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Plus, Tags } from "lucide-react";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { QuickAddBar } from "@/components/quick-add/quick-add-bar";
import {
  TransactionList,
  TransactionListEmpty,
} from "@/components/transaction-list";

/** This page blocks on live SQLite data and `searchParams` by design. */
export const instant = false;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; category?: string }>;
}) {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const { saved, category } = await searchParams;
  const allTransactions = await queries.listTransactions(userId);
  const settings = await queries.getSettings(userId);
  const templates = await queries.listTemplates(userId);
  const categories = await queries.listCategories(userId);

  // Minimal category drill-down used by the dashboard's expense breakdown.
  let activeCategory: queries.CategoryWithCount | undefined;
  let transactions = allTransactions;
  if (category) {
    const categoryId = Number(category);
    if (Number.isInteger(categoryId) && categoryId > 0) {
      const found = await queries.getCategory(userId, categoryId);
      if (found) {
        activeCategory = found;
        transactions = allTransactions.filter(
          (transaction) => transaction.category_id === found.id,
        );
      }
    }
  }

  const description = activeCategory
    ? `${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"} in “${activeCategory.name}”.`
    : transactions.length === 0
      ? "Everything you record stays on this computer."
      : `${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"} saved locally.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description={description}
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link href="/transactions/new?type=income">
                <ArrowUpRight aria-hidden="true" />
                Add income
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/transactions/new?type=expense">
                <ArrowDownRight aria-hidden="true" />
                Add expense
              </Link>
            </Button>
          </>
        }
      />

      {saved === "edit" ? (
        <Alert variant="success">Your changes were saved.</Alert>
      ) : null}
      {saved === "delete" ? (
        <Alert variant="success">Transaction deleted.</Alert>
      ) : null}

      <QuickAddBar
        templates={templates}
        categories={categories}
        currency={settings.currency}
      />

      {activeCategory ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeCategory.color }}
              aria-hidden="true"
            />
            <p className="truncate text-sm text-muted-foreground">
              Showing only{" "}
              <span className="font-medium text-foreground">
                {activeCategory.name}
              </span>{" "}
              transactions.
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-accent-strong outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear filter
            <span aria-hidden="true">✕</span>
          </Link>
        </div>
      ) : null}

      {transactions.length === 0 ? (
        activeCategory ? (
          <EmptyState
            icon={Tags}
            title="No transactions in this category"
            description={`Nothing has been recorded in ${activeCategory.name} yet.`}
            action={
              <Button asChild variant="outline">
                <Link href="/transactions">View all transactions</Link>
              </Button>
            }
          />
        ) : (
          <TransactionListEmpty />
        )
      ) : (
        <TransactionList items={transactions} currency={settings.currency} />
      )}

      <div className="flex items-center justify-center gap-2 pt-2 sm:hidden">
        <span className="text-xs text-muted-foreground">
          Looking for something else?
        </span>
        <Link
          href="/categories"
          className="text-xs font-medium text-accent-strong underline underline-offset-2"
        >
          Manage categories
        </Link>
      </div>
      <div className="hidden items-center justify-end gap-2 pt-2 sm:flex">
        <span className="text-xs text-muted-foreground">
          Need a new category?
        </span>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong underline underline-offset-2"
        >
          <Plus className="size-3" aria-hidden="true" />
          Create one
        </Link>
      </div>
    </div>
  );
}
