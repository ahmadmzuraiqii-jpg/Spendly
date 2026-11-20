import { connection } from "next/server";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SettingsView } from "@/components/settings/settings-view";

/** This page blocks on live SQLite data and the current date by design. */
export const instant = false;

export default async function SettingsPage() {
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const settings = await queries.getSettings(userId);
  const transactionCount = await queries.countTransactions(userId);
  const categories = await queries.listCategories(userId);
  const customCategoryCount = categories.filter(
    (category) => category.is_default === 0,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Preferences save the moment you change them. Everything stays on this computer — no accounts, no sync."
      />

      <SettingsView
        currency={settings.currency}
        theme={settings.theme}
        transactionCount={transactionCount}
        customCategoryCount={customCategoryCount}
      />
    </div>
  );
}
