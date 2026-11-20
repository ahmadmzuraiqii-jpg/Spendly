"use client";

import { Lock } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Lock / log out: submits the `logoutAction` server action, which clears
 * the signed session cookie and redirects to /login. Rendered in both the
 * desktop sidebar and the mobile top bar (passed `orientation` so it matches
 * each nav's styling).
 */
export function LockButton({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    return (
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Lock Spendly (log out)"
          title="Lock (log out)"
        >
          <Lock aria-hidden="true" />
        </Button>
      </form>
    );
  }

  return (
    <form action={logoutAction} className="w-full">
      <button
        type="submit"
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none",
          "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        )}
        aria-label="Lock Spendly (log out)"
        title="Lock (log out)"
      >
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        Lock
      </button>
    </form>
  );
}
