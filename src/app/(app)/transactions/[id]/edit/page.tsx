import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
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
import { formatMinorForInput } from "@/lib/money";
import { todayLocalDateString } from "@/lib/dates";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const transaction = await queries.getTransaction(userId, id);
  if (!transaction) {
    notFound();
  }

  const categories = await queries.listCategories(userId);
  const settings = await queries.getSettings(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit transaction"
        description="Update the details of this entry. Changes are saved to the local database immediately."
        backHref="/transactions"
        backLabel="All transactions"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {transaction.type === "income" ? "Income entry" : "Expense entry"}
          </CardTitle>
          <CardDescription>
            Last updated{" "}
            {new Date(transaction.updated_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            categories={categories}
            currency={settings.currency}
            today={todayLocalDateString()}
            initial={{
              id: transaction.id,
              amount: formatMinorForInput(transaction.amount_minor),
              type: transaction.type,
              categoryId: transaction.category_id,
              date: transaction.transaction_date,
              description: transaction.description,
              merchant: transaction.merchant ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
