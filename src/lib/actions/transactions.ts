"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import type { FormState } from "@/lib/form-types";
import { parseTransactionForm } from "@/lib/validation";

/**
 * Defense in depth: server actions are POSTs that can be invoked directly,
 * so each one re-verifies the session cookie even though `src/proxy.ts`
 * already gates the request path.
 */
async function requireUser(): Promise<{ formError: string } | string> {
  const userId = await getUserId();
  if (userId) return userId;
  return { formError: "Your session expired — sign in again to continue." };
}

async function requireMatchingCategory(
  userId: string,
  categoryId: number,
  type: "income" | "expense",
): Promise<FormState | null> {
  const category = await queries.getCategory(userId, categoryId);

  if (!category) {
    return { errors: { category_id: "Choose a category." } };
  }

  if (category.type !== type) {
    return {
      errors: {
        category_id: "Pick a category that matches the transaction type.",
      },
    };
  }

  return null;
}

function toFormId(formData: FormData): number | null {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createTransactionAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const parsed = parseTransactionForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const categoryError = await requireMatchingCategory(
    userId,
    parsed.value.categoryId,
    parsed.value.type,
  );
  if (categoryError) {
    return categoryError;
  }

  try {
    const transactionId = await queries.createTransaction(userId, parsed.value);
    if (!transactionId) {
      return {
        formError: "Could not save the transaction. Please try again.",
      };
    }
  } catch {
    return {
      formError: "Could not save the transaction. Please try again.",
    };
  }

  revalidatePath("/transactions");

  return {
    success:
      parsed.value.type === "income"
        ? "Income saved successfully."
        : "Expense saved successfully.",
    savedAt: Date.now(),
  };
}

export async function updateTransactionAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const id = toFormId(formData);
  if (!id) {
    return { formError: "This transaction no longer exists." };
  }

  const parsed = parseTransactionForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const categoryError = await requireMatchingCategory(
    userId,
    parsed.value.categoryId,
    parsed.value.type,
  );
  if (categoryError) {
    return categoryError;
  }

  try {
    const updated = await queries.updateTransaction(userId, id, parsed.value);
    if (!updated) {
      return { formError: "This transaction no longer exists." };
    }
  } catch {
    return {
      formError: "Could not save your changes. Please try again.",
    };
  }

  revalidatePath("/transactions");
  redirect("/transactions?saved=edit");
}

export async function deleteTransactionAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const id = toFormId(formData);
  if (!id) {
    return { formError: "This transaction no longer exists." };
  }

  try {
    const deleted = await queries.deleteTransaction(userId, id);
    if (!deleted) {
      return { formError: "This transaction no longer exists." };
    }
  } catch {
    return { formError: "Could not delete the transaction. Please try again." };
  }

  // Redirect with a banner param: the deleted row unmounts with the
  // revalidation, so an inline success message would never be seen.
  revalidatePath("/transactions");
  redirect("/transactions?saved=delete");
}
