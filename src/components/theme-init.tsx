"use client";

import { useLayoutEffect } from "react";

/**
 * Applies the persisted color theme from localStorage.
 *
 * The inline script in the root layout handles every server-rendered page
 * before first paint. This component is the safety net for responses that
 * ship no server HTML at all (the dynamic not-found pages render an empty
 * shell plus flight data, so no inline script ever executes there). Running
 * it in a layout effect means the theme is applied before the browser's
 * first paint on those pages too, and re-applying it is idempotent
 * everywhere else. It returns null, so hydration never mismatches.
 */
export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("spendly-theme");
      const dark = stored === "dark";
      const root = document.documentElement;
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    } catch {
      // localStorage unavailable (private mode) — keep the default theme.
    }
  }, []);

  return null;
}
