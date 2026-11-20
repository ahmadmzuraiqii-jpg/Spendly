import { connection } from "next/server";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { TransactionForm } from "@/components/transaction-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { todayLocalDateString } from "@/lib/dates";
import { isTransactionType } from "@/lib/validation";

/** This page blocks on live SQLite data, `searchParams` and the current date. */
export const instant = false;

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const { type } = await searchParams;
  const requestedType = type ?? "";
  const initialType = isTransactionType(requestedType)
    ? requestedType
    : "expense";

  const categories = await queries.listCategories(userId);
  const settings = await queries.getSettings(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New transaction"
        description="Record an income or an expense. Amounts are stored as integer minor units, so nothing rounds unexpectedly."
        backHref="/transactions"
        backLabel="All transactions"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {initialType === "income" ? "Add income" : "Add expense"}
          </CardTitle>
          <CardDescription>
            Fill in the details below. Only {initialType} categories are shown
            until you switch the type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            categories={categories}
            currency={settings.currency}
            today={todayLocalDateString()}
            initialType={initialType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
