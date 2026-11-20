import type { ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

/**
 * Every app route reads the local SQLite database (and often `params` or
 * `searchParams`) at request time, so waiting for that work before responding
 * is the correct behavior for this local-first app. Opting the segment out of
 * static-shell/instant-navigation validation lets the build accept these
 * blocking routes instead of requiring Suspense skeletons or cached reads.
 */
export const instant = false;

/**
 * Applies the saved `settings.theme` before this segment paints and refreshes
 * the localStorage mirror. The root layout's pre-paint script is
 * localStorage-first so the `/design` page can stay static; this script makes
 * the database authoritative on app pages for browsers that have never stored
 * a choice (or whose stored copy was cleared). The two never disagree in
 * practice because every theme change writes both.
 */
const dbThemeScript = `(function(){try{var t=__THEME__;try{localStorage.setItem("spendly-theme",t);}catch(e){}var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Prerendering stops here: app pages always render against the live SQLite
  // file (better-sqlite3 is synchronous and would otherwise be baked into a
  // build-time snapshot), and unstable values like `new Date()` only run at
  // request time.
  await connection();
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  const { theme } = await queries.getSettings(userId);
  const script = dbThemeScript.replace("__THEME__", JSON.stringify(theme));

  return (
    <>
      {/* Runs as the body starts parsing: theme set before content paints. */}
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <AppShell>{children}</AppShell>
    </>
  );
}
