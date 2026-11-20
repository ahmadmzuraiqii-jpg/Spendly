"use client";

import { Moon, Sun } from "lucide-react";
import { setThemeAction } from "@/lib/actions/settings";
import { applyTheme, currentTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

/**
 * Flips light/dark mode. The document class and localStorage update
 * synchronously so there is no flash, and the settings server action persists
 * the choice to `settings.theme` so the database stays the source of truth
 * (the settings page and the app layout both read it back).
 */
export function ThemeToggle() {
  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    // Fire-and-forget: the visible toggle never waits on the round trip.
    void setThemeAction(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
