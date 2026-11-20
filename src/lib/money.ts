import type { Currency } from "@/db/types";

/**
 * All monetary values are stored as integer minor units at a fixed scale of
 * 3 decimal places. Keep calculations in minor units and only convert for
 * display.
 */
export const MINOR_UNITS_PER_MAJOR = 1000;

const DEFAULT_LOCALE = "en-JO";

export type AmountParseResult =
  | { ok: true; minor: number }
  | { ok: false; message: string };

/**
 * Parses user input such as "12.5" or "12,5" into integer minor units without
 * ever going through floating-point arithmetic on the value itself.
 */
export function parseAmountToMinor(input: string): AmountParseResult {
  const normalized = input.trim().replace(/,/g, ".");

  if (normalized === "") {
    return { ok: false, message: "Enter an amount." };
  }

  const isValid = /^\d+(\.\d*)?$/.test(normalized) || /^\.\d+$/.test(normalized);
  if (!isValid) {
    return { ok: false, message: "Enter a number such as 12.500." };
  }

  const [integerRaw, fractionRaw = ""] = normalized.split(".");

  if (fractionRaw.length > 3) {
    return {
      ok: false,
      message: "Use at most 3 decimal places, for example 12.500.",
    };
  }

  const integerPart = integerRaw === "" ? "0" : integerRaw;
  const fractionPart = (fractionRaw + "000").slice(0, 3);

  const minor =
    Number(integerPart) * MINOR_UNITS_PER_MAJOR + Number(fractionPart);

  if (!Number.isSafeInteger(minor)) {
    return { ok: false, message: "That amount is too large." };
  }

  if (minor <= 0) {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  return { ok: true, minor };
}

/** Converts integer minor units back into the string format the form uses. */
export function formatMinorForInput(amountMinor: number): string {
  const major = Math.floor(amountMinor / MINOR_UNITS_PER_MAJOR);
  const fraction = String(amountMinor % MINOR_UNITS_PER_MAJOR).padStart(3, "0");
  return `${major}.${fraction}`;
}

export function formatMoney(
  amountMinor: number,
  currency: Currency = "JOD",
  locale = DEFAULT_LOCALE,
) {
  const fractionDigits = currency === "JOD" ? 3 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / MINOR_UNITS_PER_MAJOR);
}

/** Formats an amount with an explicit sign for income/expense lists. */
export function formatSignedMoney(
  amountMinor: number,
  type: "income" | "expense",
  currency: Currency = "JOD",
) {
  const formatted = formatMoney(amountMinor, currency);
  return type === "income" ? `+${formatted}` : `−${formatted}`;
}
