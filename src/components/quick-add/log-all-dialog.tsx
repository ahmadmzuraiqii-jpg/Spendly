"use client";

import { useEffect, useActionState } from "react";
import { LoaderCircle, Zap } from "lucide-react";
import { logAllTemplatesAction } from "@/lib/actions/templates";
import type { FormState } from "@/lib/form-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type LogAllDialogProps = {
  count: number;
  open: boolean;
  onClose: () => void;
  /** Hands the result to the bar so its banner shows after the dialog closes. */
  onResult: (state: FormState) => void;
};

/**
 * Explicit confirmation before "Log all" creates a transaction for every
 * saved template. Same accessible modal structure as the clear-data dialog:
 * Escape, backdrop, and Cancel all cancel; focus starts on Cancel and the
 * parent restores it to the trigger on close. The server action requires
 * the hidden `confirm=log-all` token, so nothing can be logged without this
 * dialog's own submit.
 */
export function LogAllDialog({
  count,
  open,
  onClose,
  onResult,
}: LogAllDialogProps) {
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await logAllTemplatesAction(prevState, formData);
      if (result.savedAt) {
        onResult(result);
        onClose();
      }
      return result;
    },
    {} as FormState,
  );

  // Lock page scrolling while the dialog is open (no state is set here).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-all-title"
        aria-describedby="log-all-description"
        className="w-full max-w-md rounded-2xl border border-border bg-popover p-5 shadow-popover sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-strong"
            aria-hidden="true"
          >
            <Zap className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="log-all-title"
              className="text-base font-semibold tracking-[-0.015em] text-foreground"
            >
              Log all templates?
            </h2>
            <p
              id="log-all-description"
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              This creates{" "}
              <span className="font-medium text-foreground">
                {count} {count === 1 ? "transaction" : "transactions"} dated
                today
              </span>
              , one for each saved template. Nothing else changes — existing
              transactions are untouched.
            </p>
          </div>
        </div>

        {state.formError ? (
          <div className="mt-4">
            <Alert variant="error">{state.formError}</Alert>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
            autoFocus
          >
            Cancel
          </Button>
          <form action={formAction}>
            <input type="hidden" name="confirm" value="log-all" />
            <Button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Logging…
                </>
              ) : (
                <>
                  <Zap aria-hidden="true" />
                  Log {count} {count === 1 ? "template" : "templates"}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
