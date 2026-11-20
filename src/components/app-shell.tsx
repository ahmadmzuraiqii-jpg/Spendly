import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The shared application frame: a sidebar on desktop and a compact top bar
 * on smaller screens, with the full navigation (Dashboard, Transactions,
 * Categories, Analytics, Settings).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-4 pb-2 pt-5">
          <Brand variant="sidebar" />
        </div>
        <div className="mt-4">
          <SiteNav orientation="vertical" />
        </div>
        <div className="mt-auto border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-sidebar-muted">Phase 5</span>
            <span className="text-xs text-sidebar-muted">Local only</span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Brand />
            <div className="flex items-center gap-1">
              <SiteNav orientation="horizontal" />
              <span
                className="mx-1 hidden h-5 w-px bg-border sm:block"
                aria-hidden="true"
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
