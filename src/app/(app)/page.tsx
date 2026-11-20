import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PageHeader } from "@/components/page-header";
import { QuickAddBar } from "@/components/quick-add/quick-add-bar";
import { todayLocalDateString } from "@/lib/dates";

/** This page blocks on live SQLite data and the current date by design. */
export const instant = false;

export default async function DashboardPage() {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }
  const transactions = await queries.listTransactions(userId);
  const settings = await queries.getSettings(userId);
  const templates = await queries.listTemplates(userId);
  const categories = await queries.listCategories(userId);
  const today = todayLocalDateString();

  const description =
    transactions.length === 0
      ? "Record your first income or expense and your overview appears here."
      : `${transactions.length} ${transactions.length === 1 ? "transaction" : "transactions"} saved locally. Everything stays on this computer.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={description}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/transactions/new?type=expense">
                <ArrowDownRight aria-hidden="true" />
                Add expense
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/transactions/new?type=income">
                <ArrowUpRight aria-hidden="true" />
                Add income
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/transactions">
                View transactions
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      />

      <QuickAddBar
        templates={templates}
        categories={categories}
        currency={settings.currency}
      />

      <DashboardView
        transactions={transactions}
        currency={settings.currency}
        today={today}
      />
    </div>
  );
}
