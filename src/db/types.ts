export type TransactionType = "income" | "expense";
export type CategoryType = TransactionType;

export type Currency = "JOD" | "USD" | "EUR" | "GBP" | "SAR";
export type Theme = "light" | "dark";

export type CategoryRow = {
  id: number;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  is_default: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: number;
  amount_minor: number;
  type: TransactionType;
  category_id: number;
  description: string;
  merchant: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type SettingsRow = {
  id: 1;
  user_id: string;
  currency: Currency;
  theme: Theme;
  created_at: string;
  updated_at: string;
};

export type TransactionTemplateRow = {
  id: number;
  name: string;
  amount_minor: number;
  type: TransactionType;
  category_id: number;
  description: string;
  merchant: string | null;
  created_at: string;
};
