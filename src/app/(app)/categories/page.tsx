import { connection } from "next/server";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import {
  CategoryCountSummary,
  CategoryPanel,
} from "@/components/category-panel";
import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";

/** This page blocks on live SQLite data so category usage counts stay fresh. */
export const instant = false;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const { saved } = await searchParams;
  const categories = await queries.listCategories(userId);
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );
  const incomeCategories = categories.filter(
    (category) => category.type === "income",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Create custom categories and keep income and expenses organized. Each color stays consistent across lists and future charts."
        actions={
          <CategoryCountSummary
            expenseCount={expenseCategories.length}
            incomeCount={incomeCategories.length}
          />
        }
      />

      {saved === "delete" ? (
        <Alert variant="success">Category deleted.</Alert>
      ) : null}

      <CategoryPanel
        type="expense"
        title="Expense categories"
        description="Where your money goes."
        categories={expenseCategories}
      />

      <CategoryPanel
        type="income"
        title="Income categories"
        description="Where your money comes from."
        categories={incomeCategories}
      />
    </div>
  );
}
