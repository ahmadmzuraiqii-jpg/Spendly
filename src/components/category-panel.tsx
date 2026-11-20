import Link from "next/link";
import { Pencil } from "lucide-react";
import type { CategoryType } from "@/db/types";
import type { CategoryWithCount } from "@/lib/supabase/queries";
import { CategoryForm } from "@/components/category-form";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CATEGORY_ICONS,
  type CategoryIconSlug,
} from "@/lib/category-icons";
import { CircleEllipsis } from "lucide-react";
import { cn } from "@/lib/utils";

function CategoryRow({ category }: { category: CategoryWithCount }) {
  const Icon = CATEGORY_ICONS[category.icon as CategoryIconSlug] ?? CircleEllipsis;
  const usage =
    category.transaction_count === 0
      ? "Not used yet"
      : `${category.transaction_count} ${
          category.transaction_count === 1 ? "transaction" : "transactions"
        }`;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg"
        style={{
          backgroundColor: `${category.color}26`,
          color: category.color,
        }}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{category.name}</span>
          <Badge
            variant={category.is_default ? "outline" : "accent"}
            className="text-[10px]"
          >
            {category.is_default ? "Default" : "Custom"}
          </Badge>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{usage}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/categories/${category.id}/edit`}>
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <DeleteCategoryButton id={category.id} name={category.name} />
      </div>
    </li>
  );
}

export function CategoryPanel({
  type,
  title,
  description,
  categories,
}: {
  type: CategoryType;
  title: string;
  description: string;
  categories: CategoryWithCount[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="pt-1.5">{description}</CardDescription>
        </div>
        <Badge variant={type}>{type === "income" ? "Income" : "Expense"}</Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Add a custom category
          </p>
          <div className="mt-4">
            <CategoryForm type={type} />
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {type} categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryCountSummary({
  expenseCount,
  incomeCount,
  className,
}: {
  expenseCount: number;
  incomeCount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <span className="text-muted-foreground">
        <span className="font-semibold text-foreground">{expenseCount}</span>{" "}
        expense
      </span>
      <span className="text-muted-foreground">
        <span className="font-semibold text-foreground">{incomeCount}</span>{" "}
        income
      </span>
    </div>
  );
}
