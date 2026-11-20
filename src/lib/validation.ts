import type { CategoryType, TransactionType } from "@/db/types";
import { CATEGORY_ICON_SLUGS } from "@/lib/category-icons";
import { parseAmountToMinor } from "@/lib/money";

export type FieldErrors = Record<string, string>;

export type TransactionFormValue = {
  amountMinor: number;
  type: TransactionType;
  categoryId: number;
  date: string;
  description: string;
  merchant: string | null;
};

export type CategoryFormValue = {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export type TemplateFormValue = {
  name: string;
  amountMinor: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  merchant: string | null;
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** True for strings that are a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2200 || month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isTransactionType(value: string): value is TransactionType {
  return value === "income" || value === "expense";
}

export function parseTransactionForm(
  formData: FormData,
): ParseResult<TransactionFormValue> {
  const errors: FieldErrors = {};

  const amount = parseAmountToMinor(readString(formData, "amount"));
  if (!amount.ok) {
    errors.amount = amount.message;
  }

  const type = readString(formData, "type");
  if (!isTransactionType(type)) {
    errors.type = "Choose income or expense.";
  }

  const categoryIdRaw = readString(formData, "category_id");
  const categoryId = Number(categoryIdRaw);
  if (categoryIdRaw === "" || !Number.isInteger(categoryId) || categoryId <= 0) {
    errors.category_id = "Choose a category.";
  }

  const date = readString(formData, "date").trim();
  if (!isValidDateString(date)) {
    errors.date = "Choose a valid date.";
  }

  const description = readString(formData, "description").trim();
  if (description.length < 1) {
    errors.description = "Add a short description.";
  } else if (description.length > 200) {
    errors.description = "Keep the description under 200 characters.";
  }

  const merchantRaw = readString(formData, "merchant").trim();
  let merchant: string | null = null;
  if (merchantRaw.length > 0) {
    if (merchantRaw.length > 120) {
      errors.merchant = "Keep the merchant under 120 characters.";
    } else {
      merchant = merchantRaw;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      amountMinor: amount.ok ? amount.minor : 0,
      type: isTransactionType(type) ? type : "expense",
      categoryId,
      date,
      description,
      merchant,
    },
  };
}

export function parseCategoryForm(
  formData: FormData,
): ParseResult<CategoryFormValue> {
  const errors: FieldErrors = {};

  const name = readString(formData, "name").trim();
  if (name.length < 1) {
    errors.name = "Give the category a name.";
  } else if (name.length > 40) {
    errors.name = "Keep the name under 40 characters.";
  }

  const type = readString(formData, "type");
  if (type !== "income" && type !== "expense") {
    errors.type = "Choose income or expense.";
  }

  const color = readString(formData, "color").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    errors.color = "Pick a color.";
  }

  const icon = readString(formData, "icon").trim();
  if (!CATEGORY_ICON_SLUGS.includes(icon as never)) {
    errors.icon = "Pick an icon.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      type: type === "income" ? "income" : "expense",
      color: color.toUpperCase(),
      icon,
    },
  };
}

/**
 * Parses the quick-add template form. Field rules mirror the transaction
 * form (the template's description and merchant are what land on every
 * logged transaction) plus a short unique-friendly name.
 */
export function parseTemplateForm(
  formData: FormData,
): ParseResult<TemplateFormValue> {
  const errors: FieldErrors = {};

  const name = readString(formData, "name").trim();
  if (name.length < 1) {
    errors.name = "Give the template a name.";
  } else if (name.length > 40) {
    errors.name = "Keep the name under 40 characters.";
  }

  const amount = parseAmountToMinor(readString(formData, "amount"));
  if (!amount.ok) {
    errors.amount = amount.message;
  }

  const type = readString(formData, "type");
  if (!isTransactionType(type)) {
    errors.type = "Choose income or expense.";
  }

  const categoryIdRaw = readString(formData, "category_id");
  const categoryId = Number(categoryIdRaw);
  if (categoryIdRaw === "" || !Number.isInteger(categoryId) || categoryId <= 0) {
    errors.category_id = "Choose a category.";
  }

  const description = readString(formData, "description").trim();
  if (description.length < 1) {
    errors.description = "Add a short description.";
  } else if (description.length > 200) {
    errors.description = "Keep the description under 200 characters.";
  }

  const merchantRaw = readString(formData, "merchant").trim();
  let merchant: string | null = null;
  if (merchantRaw.length > 0) {
    if (merchantRaw.length > 120) {
      errors.merchant = "Keep the merchant under 120 characters.";
    } else {
      merchant = merchantRaw;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      amountMinor: amount.ok ? amount.minor : 0,
      type: isTransactionType(type) ? type : "expense",
      categoryId,
      description,
      merchant,
    },
  };
}
