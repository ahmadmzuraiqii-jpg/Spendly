"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowDownRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/lib/actions/transactions";
import type { CategoryRow, Currency, TransactionType } from "@/db/types";
import type { FormState } from "@/lib/form-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type InitialTransaction = {
  id: number;
  amount: string;
  type: TransactionType;
  categoryId: number;
  date: string;
  description: string;
  merchant: string;
};

type TransactionFormProps = {
  categories: CategoryRow[];
  currency: Currency;
  /** Used for the create form; edit mode keeps the stored date. */
  today: string;
  initialType?: TransactionType;
  initial?: InitialTransaction;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function TransactionForm({
  categories,
  currency,
  today,
  initialType = "expense",
  initial,
}: TransactionFormProps) {
  const isEdit = Boolean(initial);

  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [type, setType] = useState<TransactionType>(
    initial?.type ?? initialType,
  );
  const [categoryId, setCategoryId] = useState(
    initial ? String(initial.categoryId) : "",
  );
  const [date, setDate] = useState(initial?.date ?? today);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");

  const [state, formAction, pending] = useActionState(
    isEdit ? updateTransactionAction : createTransactionAction,
    {} as FormState,
  );

  // After a successful save, reset the money and text fields during render so
  // the next entry starts clean. Date and type stay put because consecutive
  // entries usually share them. (React's documented "adjust state when a
  // value changes" pattern — no effect needed.)
  const [clearedAt, setClearedAt] = useState(0);
  if (!isEdit && state.savedAt && state.savedAt !== clearedAt) {
    setClearedAt(state.savedAt);
    setAmount("");
    setDescription("");
    setMerchant("");
  }

  function selectType(nextType: TransactionType) {
    setType(nextType);
    const selected = categories.find(
      (category) => category.id === Number(categoryId),
    );
    if (selected && selected.type !== nextType) {
      setCategoryId("");
    }
  }

  const visibleCategories = categories.filter(
    (category) => category.type === type,
  );

  const submitLabel = pending
    ? "Saving…"
    : isEdit
      ? "Save changes"
      : type === "income"
        ? "Add income"
        : "Add expense";

  return (
    <form action={formAction} className="space-y-5">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="type" value={type} />

      {state.formError ? <Alert variant="error">{state.formError}</Alert> : null}
      {state.success ? (
        <Alert variant="success">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {state.success}
            <Link
              href="/transactions"
              className="font-medium underline underline-offset-2"
            >
              View all transactions
            </Link>
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0.000"
              autoComplete="off"
              className="pr-16 tabular-nums"
              value={amount}
              aria-invalid={Boolean(state.errors?.amount)}
              onChange={(event) => setAmount(event.target.value)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {currency}
            </span>
          </div>
          <FieldError message={state.errors?.amount} />
          {!state.errors?.amount ? (
            <p className="text-xs text-muted-foreground">
              Up to 3 decimal places, for example 12.500.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            aria-invalid={Boolean(state.errors?.date)}
            onChange={(event) => setDate(event.target.value)}
          />
          <FieldError message={state.errors?.date} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["income", "expense"] as const).map((option) => {
            const isActive = type === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectType(option)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    option === "income" ? "bg-income" : "bg-expense",
                  )}
                  aria-hidden="true"
                />
                {option === "income" ? "Income" : "Expense"}
                {option === "income" ? (
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3.5" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <FieldError message={state.errors?.type} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          name="category_id"
          value={categoryId}
          aria-invalid={Boolean(state.errors?.category_id)}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Select a category</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <FieldError message={state.errors?.category_id} />
        {!state.errors?.category_id ? (
          <p className="text-xs text-muted-foreground">
            Only {type} categories are listed.{" "}
            <Link
              href="/categories"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Manage categories
            </Link>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder={
            type === "income" ? "e.g. Monthly salary" : "e.g. Groceries"
          }
          maxLength={200}
          autoComplete="off"
          value={description}
          aria-invalid={Boolean(state.errors?.description)}
          onChange={(event) => setDescription(event.target.value)}
        />
        <FieldError message={state.errors?.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchant">
          Merchant or source
          <span className="font-normal text-muted-foreground"> (optional)</span>
        </Label>
        <Input
          id="merchant"
          name="merchant"
          placeholder={
            type === "income" ? "e.g. Acme Corp" : "e.g. Central Market"
          }
          maxLength={120}
          autoComplete="off"
          value={merchant}
          aria-invalid={Boolean(state.errors?.merchant)}
          onChange={(event) => setMerchant(event.target.value)}
        />
        <FieldError message={state.errors?.merchant} />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="outline" size="lg">
          <Link href="/transactions">Cancel</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="sm:min-w-40"
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
