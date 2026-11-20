import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase-backed authentication.
 *
 * Used by `src/proxy.ts` (first line of defense on every request), the
 * `/login` page, and — as defense in depth — every mutating server action.
 */

/**
 * Verifies if there is an active Supabase session.
 */
export async function isAuthenticated(): Promise<boolean> {
  return (await getUserId()) !== null;
}

/**
 * Verifies if there is an active Supabase session and returns the user ID.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
