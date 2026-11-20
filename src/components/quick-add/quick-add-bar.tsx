"use client";

import { useRef, useState, useTransition } from "react";
import { LoaderCircle, Plus, ListChecks, Zap } from "lucide-react";
import type { CategoryRow, Currency } from "@/db/types";
import type { TemplateListItem } from "@/lib/supabase/queries";
import { logTemplateAction } from "@/lib/actions/templates";
import type { FormState } from "@/lib/form-types";
import { formatSignedMoney } from "@/lib/money";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LogAllDialog } from "@/components/quick-add/log-all-dialog";
import { TemplateManagerModal } from "@/components/quick-add/template-manager-modal";
import { cn } from "@/lib/utils";

type QuickAddBarProps = {
  templates: TemplateListItem[];
  categories: CategoryRow[];
  currency: Currency;
};

/**
 * The Quick-add bar (dashboard + transactions): one tap logs a saved
 * template as a real transaction dated today. Logging runs through a
 * server action that revalidates the whole layout, so dashboard totals,
 * charts, and the transaction list refresh immediately while the bar keeps
 * its confirmation banner. The empty state doubles as the entry point for
 * creating the first template.
 */
export function QuickAddBar({
  templates,
  categories,
  currency,
}: QuickAddBarProps) {
  const [banner, setBanner] = useState<FormState>({});
  const [logPending, startLogTransition] = useTransition();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [logAllOpen, setLogAllOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logAllTriggerRef = useRef<HTMLButtonElement>(null);

  function logOne(template: TemplateListItem) {
    startLogTransition(async () => {
      setPendingId(template.id);
      try {
        const result = await logTemplateAction(template.id);
        setBanner(result);
      } finally {
        setPendingId(null);
      }
    });
  }

  function openManager() {
    setManagerOpen(true);
  }

  function closeManager() {
    setManagerOpen(false);
    triggerRef.current?.focus();
  }

  function closeLogAll() {
    setLogAllOpen(false);
    logAllTriggerRef.current?.focus();
  }

  return (
    <section
      aria-labelledby="quick-add-heading"
      className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-strong"
            aria-hidden="true"
          >
            <Zap className="size-4" />
          </span>
          <div>
            <h2
              id="quick-add-heading"
              className="text-sm font-semibold tracking-[-0.01em] text-foreground"
            >
              Quick add
            </h2>
            <p className="text-xs text-muted-foreground">
              {templates.length === 0
                ? "Log recurring entries in one tap."
                : "Tap a template to log it for today."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {templates.length >= 2 ? (
            <Button
              ref={logAllTriggerRef}
              type="button"
              variant="secondary"
              size="sm"
              disabled={logPending}
              onClick={() => setLogAllOpen(true)}
            >
              <ListChecks aria-hidden="true" />
              Log all
            </Button>
          ) : null}
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            size="sm"
            disabled={logPending}
            onClick={openManager}
          >
            <Plus aria-hidden="true" />
            New template
          </Button>
        </div>
      </div>

      {banner.success ? (
        <Alert variant="success">{banner.success}</Alert>
      ) : null}
      {banner.formError ? (
        <Alert variant="error">{banner.formError}</Alert>
      ) : null}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              No quick-add templates yet
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Save repetitive entries like subscriptions or rent, then log
              each one with a single tap — no form needed.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={openManager}
          >
            <Plus aria-hidden="true" />
            Create your first template
          </Button>
        </div>
      ) : (
        <ul className="flex flex-wrap items-center gap-2">
          {templates.map((template) => {
            const isLoggingThis = logPending && pendingId === template.id;
            return (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => logOne(template)}
                  disabled={logPending}
                  title={`Log “${template.name}” for today`}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm shadow-xs transition-[color,background-color,border-color] duration-150 outline-none",
                    "hover:border-input/80 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: template.category_color }}
                    aria-hidden="true"
                  />
                  <span className="max-w-40 truncate font-medium text-foreground sm:max-w-none">
                    {template.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold tabular-nums",
                      template.type === "income"
                        ? "text-income"
                        : "text-expense",
                    )}
                  >
                    {formatSignedMoney(
                      template.amount_minor,
                      template.type,
                      currency,
                    )}
                  </span>
                  {isLoggingThis ? (
                    <LoaderCircle
                      className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <TemplateManagerModal
        open={managerOpen}
        onClose={closeManager}
        templates={templates}
        categories={categories}
        currency={currency}
      />

      <LogAllDialog
        count={templates.length}
        open={logAllOpen}
        onClose={closeLogAll}
        onResult={setBanner}
      />
    </section>
  );
}
