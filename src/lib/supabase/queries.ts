import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { 
  Currency, 
  Theme,
  CategoryType,
  TransactionType,
  CategoryRow,
  TransactionRow,
  TransactionTemplateRow,
} from "@/db/types";

export type CategoryWithCount = CategoryRow & { transaction_count: number };
export type TransactionListItem = TransactionRow & {
  category_name: string;
  category_color: string;
  category_icon: string;
};
export type TemplateListItem = TransactionTemplateRow & {
  category_name: string;
  category_color: string;
  category_icon: string;
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type Settings = { currency: Currency; theme: Theme };

export async function getSettings(userId: string): Promise<Settings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("currency, theme")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { currency: "JOD", theme: "dark" };
  }
  return data as Settings;
}

export async function updateSettings(userId: string, input: {
  currency?: Currency;
  theme?: Theme;
}): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("settings")
    .update(input)
    .eq("user_id", userId);

  return !error;
}

export async function clearAllData(userId: string): Promise<{
  transactionsDeleted: number;
  categoriesDeleted: number;
}> {
  const supabase = await createClient();

  // Note: Transactions have a foreign key to categories (ON DELETE RESTRICT),
  // so we must delete transactions first.
  const { count: transactionsDeleted, error: tError } = await supabase
    .from("transactions")
    .delete({ count: 'exact' })
    .eq("user_id", userId);

  const { count: categoriesDeleted, error: cError } = await supabase
    .from("categories")
    .delete({ count: 'exact' })
    .eq("user_id", userId)
    .eq("is_default", false);

  if (tError || cError) {
    console.error("Error clearing data", tError || cError);
  }

  return {
    transactionsDeleted: transactionsDeleted || 0,
    categoriesDeleted: categoriesDeleted || 0,
  };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function listCategories(userId: string): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(`*, transactions(id)`)
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((c) => ({
    ...c,
    is_default: c.is_default ? 1 : 0,
    transaction_count: Array.isArray(c.transactions) ? c.transactions.length : 0,
  })) as CategoryWithCount[];
}

export async function listCategoriesByType(userId: string, type: CategoryType): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type);

  if (error || !data) return [];

  return data.map((c) => ({
    ...c,
    is_default: c.is_default ? 1 : 0,
  })) as CategoryRow[];
}

export async function getCategory(userId: string, id: number): Promise<CategoryWithCount | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(`*, transactions(id)`)
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    ...data,
    is_default: data.is_default ? 1 : 0,
    transaction_count: Array.isArray(data.transactions) ? data.transactions.length : 0,
  } as CategoryWithCount;
}

export async function createCategory(userId: string, input: {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...input,
      user_id: userId,
      is_default: false,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function updateCategory(
  userId: string,
  id: number,
  input: { name: string; color: string; icon: string },
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(input)
    .eq("user_id", userId)
    .eq("id", id);

  return !error;
}

export async function deleteCategory(userId: string, id: number): Promise<{ ok: boolean; usedBy?: number }> {
  const count = await countTransactionsInCategory(userId, id);
  if (count > 0) {
    return { ok: false, usedBy: count };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
    
  return { ok: !error };
}

export async function countTransactionsInCategory(userId: string, id: number): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category_id", id);

  return error ? 0 : (count || 0);
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

export async function listTransactions(userId: string): Promise<TransactionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      categories(name, color, icon)
    `)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("id", { ascending: false });

  if (error || !data) return [];

  return data.map((t) => ({
    ...t,
    category_name: (t.categories as any)?.name ?? "",
    category_color: (t.categories as any)?.color ?? "",
    category_icon: (t.categories as any)?.icon ?? "",
  })) as TransactionListItem[];
}

export async function getTransaction(userId: string, id: number): Promise<TransactionListItem | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      categories(name, color, icon)
    `)
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    ...data,
    category_name: (data.categories as any)?.name ?? "",
    category_color: (data.categories as any)?.color ?? "",
    category_icon: (data.categories as any)?.icon ?? "",
  } as TransactionListItem;
}

export async function createTransaction(userId: string, input: {
  amountMinor: number;
  type: TransactionType;
  categoryId: number;
  date: string;
  description: string;
  merchant: string | null;
}): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      amount_minor: input.amountMinor,
      type: input.type,
      category_id: input.categoryId,
      transaction_date: input.date,
      description: input.description,
      merchant: input.merchant,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function updateTransaction(
  userId: string,
  id: number,
  input: {
    amountMinor: number;
    type: TransactionType;
    categoryId: number;
    date: string;
    description: string;
    merchant: string | null;
  },
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      amount_minor: input.amountMinor,
      type: input.type,
      category_id: input.categoryId,
      transaction_date: input.date,
      description: input.description,
      merchant: input.merchant,
    })
    .eq("user_id", userId)
    .eq("id", id);

  return !error;
}

export async function deleteTransaction(userId: string, id: number): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
    
  return !error;
}

export async function countTransactions(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return error ? 0 : (count || 0);
}

/* ------------------------------------------------------------------ */
/* Quick-add templates                                                 */
/* ------------------------------------------------------------------ */

export async function listTemplates(userId: string): Promise<TemplateListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_templates")
    .select(`
      *,
      categories(name, color, icon)
    `)
    .eq("user_id", userId)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data) return [];

  return data.map((t) => ({
    ...t,
    category_name: (t.categories as any)?.name ?? "",
    category_color: (t.categories as any)?.color ?? "",
    category_icon: (t.categories as any)?.icon ?? "",
  })) as TemplateListItem[];
}

export async function getTemplate(userId: string, id: number): Promise<TemplateListItem | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_templates")
    .select(`
      *,
      categories(name, color, icon)
    `)
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    ...data,
    category_name: (data.categories as any)?.name ?? "",
    category_color: (data.categories as any)?.color ?? "",
    category_icon: (data.categories as any)?.icon ?? "",
  } as TemplateListItem;
}

export async function templateNameExists(userId: string, name: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("transaction_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("name", name);

  return !error && (count || 0) > 0;
}

export async function createTemplate(userId: string, input: {
  name: string;
  amountMinor: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  merchant: string | null;
}): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_templates")
    .insert({
      name: input.name,
      amount_minor: input.amountMinor,
      type: input.type,
      category_id: input.categoryId,
      description: input.description,
      merchant: input.merchant,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function deleteTemplate(userId: string, id: number): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transaction_templates")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
    
  return !error;
}

export async function logTemplateForDate(userId: string, id: number, date: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Fetch the template
  const { data: template, error: fetchError } = await supabase
    .from("transaction_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();
    
  if (fetchError || !template) return false;
  
  // Insert transaction
  const { error: insertError } = await supabase
    .from("transactions")
    .insert({
      amount_minor: template.amount_minor,
      type: template.type,
      category_id: template.category_id,
      description: template.description,
      merchant: template.merchant,
      transaction_date: date,
      user_id: userId,
    });
    
  return !insertError;
}

export async function logAllTemplatesForDate(userId: string, date: string): Promise<number> {
  const supabase = await createClient();
  
  // Fetch all templates
  const { data: templates, error: fetchError } = await supabase
    .from("transaction_templates")
    .select("*")
    .eq("user_id", userId);
    
  if (fetchError || !templates || templates.length === 0) return 0;
  
  // Insert transactions
  const { error: insertError } = await supabase
    .from("transactions")
    .insert(templates.map(t => ({
      amount_minor: t.amount_minor,
      type: t.type,
      category_id: t.category_id,
      description: t.description,
      merchant: t.merchant,
      transaction_date: date,
      user_id: userId,
    })));
    
  return insertError ? 0 : templates.length;
}
