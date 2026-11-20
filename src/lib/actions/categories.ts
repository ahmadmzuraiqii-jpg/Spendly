"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import type { FormState } from "@/lib/form-types";
import { parseCategoryForm } from "@/lib/validation";

/** Re-verifies the session inside every mutating action (defense in depth). */
async function requireUser(): Promise<{ formError: string } | string> {
  const userId = await getUserId();
  if (userId) return userId;
  return { formError: "Your session expired — sign in again to continue." };
}

function toFormId(formData: FormData): number | null {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isUniqueConstraint(error: any): boolean {
  return error?.code === "23505";
}

export async function createCategoryAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  try {
    const categoryId = await queries.createCategory(userId, parsed.value);
    if (!categoryId) {
      return { formError: "Could not create the category. Please try again." };
    }
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return {
        errors: {
          name: `An ${parsed.value.type} category named "${parsed.value.name}" already exists.`, 
        },
      };
    }
    return { formError: "Could not create the category. Please try again." };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");

  return {
    success: `Category "${parsed.value.name}" created.`, 
    savedAt: Date.now(),
  };
}

export async function updateCategoryAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const id = toFormId(formData);
  if (!id) {
    return { formError: "This category no longer exists." };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  try {
    const updated = await queries.updateCategory(userId, id, {
      name: parsed.value.name,
      color: parsed.value.color,
      icon: parsed.value.icon,
    });
    if (!updated) {
      return { formError: "This category no longer exists." };
    }
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return {
        errors: {
          name: `An ${parsed.value.type} category named "${parsed.value.name}" already exists.`, 
        },
      };
    }
    return { formError: "Could not save your changes. Please try again." };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return {
    success: `Category "${parsed.value.name}" updated.`, 
    savedAt: Date.now(),
  };
}

export async function deleteCategoryAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const id = toFormId(formData);
  if (!id) {
    return { formError: "This category no longer exists." };
  }

  try {
    const result = await queries.deleteCategory(userId, id);

    if (!result.ok && result.usedBy) {
      const label = result.usedBy === 1 ? "transaction" : "transactions";
      return {
        formError: `This category is used by ${result.usedBy} ${label}. Reassign those transactions before deleting it.`,
      };
    }

    if (!result.ok) {
      return { formError: "This category no longer exists." };
    }
  } catch {
    return { formError: "Could not delete the category. Please try again." };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  // Redirect with a banner param: the deleted row unmounts with the
  // revalidation, so an inline success message would never be seen.
  redirect("/categories?saved=delete");
}
