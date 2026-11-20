import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { CategoryForm } from "@/components/category-form";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** This page blocks on live SQLite data and `params`. */
export const instant = false;

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const category = await queries.getCategory(userId, id);
  if (!category) {
    notFound();
  }

  const usage =
    category.transaction_count === 0
      ? "Nothing uses this category yet."
      : `${category.transaction_count} ${
          category.transaction_count === 1 ? "transaction" : "transactions"
        } currently use${category.transaction_count === 1 ? "s" : ""} it.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit category"
        description="Rename it, choose a new color or pick a different icon. The type cannot change once the category exists."
        backHref="/categories"
        backLabel="All categories"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>{usage}</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            type={category.type}
            categoryId={category.id}
            initial={{
              name: category.name,
              color: category.color,
              icon: category.icon,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
