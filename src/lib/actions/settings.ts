"use server";

import { revalidatePath } from "next/cache";
import * as queries from "@/lib/supabase/queries";
import type { Currency, Theme } from "@/db/types";
import { getUserId } from "@/lib/auth";
import type { FormState } from "@/lib/form-types";

const CURRENCIES: readonly Currency[] = ["JOD", "USD", "EUR", "GBP", "SAR"];
const THEMES: readonly Theme[] = ["light", "dark"];

/** Re-verifies the session inside every mutating action (defense in depth). */
async function requireUser(): Promise<{ formError: string } | string> {
  const userId = await getUserId();
  if (userId) return userId;
  return { formError: "Your session expired — sign in again to continue." };
}

function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" &&
    (CURRENCIES as readonly string[]).includes(value)
  );
}

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Saves the display currency and the color theme from the settings form.
 *
 * The currency is a *presentation* preference: this action only writes the
 * `settings` row. Stored `amount_minor` values are never read, converted, or
 * rewritten, so an expense of 100 stays 100 in the database — it simply
 * renders with a different symbol from now on.
 *
 * Both preferences are cross-cutting, so the entire layout (every page)
 * revalidates and immediately shows the new values.
 */
export async function saveSettingsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const currency = formData.get("currency");
  const theme = formData.get("theme");

  if (!isCurrency(currency)) {
    return { formError: "Choose a supported display currency." };
  }
  if (!isTheme(theme)) {
    return { formError: "Choose light or dark mode." };
  }

  await queries.updateSettings(userId, { currency, theme });
  revalidatePath("/", "layout");

  return {
    success: `Preferences saved — amounts now display as ${currency}.`,
    savedAt: Date.now(),
  };
}

/**
 * Deletes every transaction and every custom (non-default) category after
 * the user confirmed the warning modal. The confirmation token must come
 * back with the form, so the delete only ever runs from that explicit
 * submit. Default categories and the settings row (currency, theme) are
 * kept. The whole layout revalidates so all pages immediately reflect the
 * empty state.
 */
export async function clearAllDataAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  if (formData.get("confirm") !== "delete-all") {
    return { formError: "The deletion was not confirmed — nothing was removed." };
  }

  const result = await queries.clearAllData(userId);
  revalidatePath("/", "layout");

  if (result.transactionsDeleted === 0 && result.categoriesDeleted === 0) {
    return { formError: "There was no data to clear." };
  }

  const parts: string[] = [];
  if (result.transactionsDeleted > 0) {
    parts.push(
      `${result.transactionsDeleted} ${
        result.transactionsDeleted === 1 ? "transaction" : "transactions"
      }`,
    );
  }
  if (result.categoriesDeleted > 0) {
    parts.push(
      `${result.categoriesDeleted} custom ${
        result.categoriesDeleted === 1 ? "category" : "categories"
      }`,
    );
  }

  return { success: `Cleared ${parts.join(" and ")}.`, savedAt: Date.now() };
}

/**
 * Persists only the color theme, for the header's quick toggle. The caller
 * applies the class to `<html>` immediately (no flash) and this action keeps
 * the database — which the settings page and the app layout read — in sync.
 */
export async function setThemeAction(theme: unknown): Promise<{
  ok: boolean;
}> {
  // The header toggle can outlive a session (stale tab), so re-verify here.
  const userId = await getUserId();
  if (!userId) {
    return { ok: false };
  }

  if (!isTheme(theme)) {
    return { ok: false };
  }

  await queries.updateSettings(userId, { theme });
  revalidatePath("/", "layout");
  return { ok: true };
}
