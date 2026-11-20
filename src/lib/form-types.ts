import type { FieldErrors } from "@/lib/validation";

/**
 * Shared return shape for the form server actions. Expected problems (bad
 * input, duplicate names, categories in use) are modeled as values, not
 * thrown errors, so the form can render them inline.
 */
export type FormState = {
  errors?: FieldErrors;
  formError?: string;
  success?: string;
  /** Increments on every successful save so forms can reset reliably. */
  savedAt?: number;
};

export const emptyFormState: FormState = {};
