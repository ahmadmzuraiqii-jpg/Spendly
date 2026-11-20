import { connection } from "next/server";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { PageHeader } from "@/components/page-header";
import { todayLocalDateString } from "@/lib/dates";

export default async function AnalyticsPage() {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }
  const transactions = await queries.listTransactions(userId);
  const settings = await queries.getSettings(userId);
  const today = todayLocalDateString();

  const description =
    transactions.length === 0
      ? "Add income and expenses to see trends, category analysis, and observations."
      : `A deeper look at your ${transactions.length} saved ${transactions.length === 1 ? "transaction" : "transactions"} — trends, categories, and rule-based observations.`;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description={description} />

      <AnalyticsView
        transactions={transactions}
        currency={settings.currency}
        today={today}
      />
    </div>
  );
}
