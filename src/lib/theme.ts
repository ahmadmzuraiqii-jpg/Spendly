import type { Theme } from "@/db/types";

/**
 * Applies a color theme to the document and mirrors it into localStorage so
 * the pre-paint script in the root layout can restore it on the next load.
 *
 * The database `settings.theme` row is the source of truth (the app layout
 * re-applies it and refreshes localStorage on every request); localStorage is
 * the fast path that avoids a flash of the wrong scheme before the server
 * HTML arrives. Every place that changes the theme calls this helper *and*
 * the settings server action, so the two never drift apart.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  try {
    localStorage.setItem("spendly-theme", theme);
  } catch {
    // Storage can be unavailable in private browsing; the theme still applies.
  }
}

/** The theme currently displayed on the document. */
export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
