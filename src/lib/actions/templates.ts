"use server";

import { revalidatePath } from "next/cache";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import type { FormState } from "@/lib/form-types";
import { formatDisplayDate, todayLocalDateString } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { parseTemplateForm } from "@/lib/validation";

/** Re-verifies the session inside every mutating action (defense in depth). */
async function requireUser(): Promise<string | { formError: string }> {
  const userId = await getUserId();
  if (userId) return userId;
  return { formError: "Your session expired — sign in again to continue." };
}

/** Accepts ids coming from hidden form fields or direct client calls. */
function toId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Creates a quick-add template after re-checking the category's type and
 * that the name is unused (case-insensitively — the UNIQUE constraint backs
 * this up at the database level).
 *
 * Templates only describe how to log a *future* transaction: nothing here
 * touches `transactions`, and amounts stay integer minor units.
 */
export async function createTemplateAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const parsed = parseTemplateForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  const category = await queries.getCategory(userId, parsed.value.categoryId);
  if (!category) {
    return { errors: { category_id: "Choose a category." } };
  }
  if (category.type !== parsed.value.type) {
    return {
      errors: {
        category_id: "Pick a category that matches the template type.",
      },
    };
  }

  if (await queries.templateNameExists(userId, parsed.value.name)) {
    return {
      errors: { name: "You already have a template with that name." },
    };
  }

  try {
    await queries.createTemplate(userId, parsed.value);
  } catch {
    return {
      formError: "Could not save the template. Please try again.",
    };
  }

  // Cross-cutting: the quick-add bar exists on the dashboard and the
  // transactions page, so refresh every route.
  revalidatePath("/", "layout");

  return {
    success: `Template “${parsed.value.name}” saved — tap it under Quick add to log a transaction.`,
    savedAt: Date.now(),
  };
}

/** Deletes a template only. Transactions already logged from it stay. */
export async function deleteTemplateAction(id: unknown): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const templateId = toId(id);
  if (!templateId) {
    return { formError: "This template no longer exists." };
  }

  const template = await queries.getTemplate(userId, templateId);
  if (!template) {
    return { formError: "This template no longer exists." };
  }

  try {
    const deleted = await queries.deleteTemplate(userId, templateId);
    if (!deleted) {
      return { formError: "This template no longer exists." };
    }
  } catch {
    return { formError: "Could not delete the template. Please try again." };
  }

  revalidatePath("/", "layout");
  return {
    success: `Template “${template.name}” deleted.`,
    savedAt: Date.now(),
  };
}

/**
 * Logs one template as a real transaction dated today. The insert copies
 * integer minor units straight from the template, and the whole layout
 * revalidates so dashboard totals, charts, and the list update immediately.
 */
export async function logTemplateAction(id: unknown): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const templateId = toId(id);
  if (!templateId) {
    return { formError: "This template no longer exists." };
  }

  const template = await queries.getTemplate(userId, templateId);
  if (!template) {
    return { formError: "This template no longer exists." };
  }

  const today = todayLocalDateString();
  try {
    const logged = await queries.logTemplateForDate(userId, templateId, today);
    if (!logged) {
      return { formError: "This template no longer exists." };
    }
  } catch {
    return { formError: "Could not log the transaction. Please try again." };
  }

  revalidatePath("/", "layout");

  const { currency } = await queries.getSettings(userId);
  return {
    success: `Logged “${template.name}” — ${formatMoney(
      template.amount_minor,
      currency,
    )} saved for ${formatDisplayDate(today)}.`,
    savedAt: Date.now(),
  };
}

/**
 * Logs every saved template in one transaction, gated behind the same
 * explicit confirmation token pattern as "clear all data" so the delete
 * only ever runs from the dialog's own submit.
 */
export async function logAllTemplatesAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  if (formData.get("confirm") !== "log-all") {
    return { formError: "The action was not confirmed — nothing was logged." };
  }

  const today = todayLocalDateString();
  let logged = 0;
  try {
    logged = await queries.logAllTemplatesForDate(userId, today);
  } catch {
    return { formError: "Could not log the transactions. Please try again." };
  }

  if (logged === 0) {
    return { formError: "There are no templates to log." };
  }

  revalidatePath("/", "layout");

  return {
    success: `Logged all ${logged} ${
      logged === 1 ? "template" : "templates"
    } — ${logged} ${
      logged === 1 ? "transaction" : "transactions"
    } saved for ${formatDisplayDate(today)}.`,
    savedAt: Date.now(),
  };
}
