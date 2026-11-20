"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { clearAllDataAction } from "@/lib/actions/settings";
import type { FormState } from "@/lib/form-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ClearDataButtonProps = {
  transactionCount: number;
  customCategoryCount: number;
  /** Disabled when there is genuinely nothing to delete. */
  disabled?: boolean;
};

/**
 * "Clear all data" with an explicit warning modal (the PRD requires an
 * explicit confirmation before anything is deleted). The dialog follows the
 * accessible modal pattern: `role="dialog"`, `aria-modal`, labelled by its
 * title and described by the warning, Escape and backdrop clicks cancel,
 * focus starts on the safe Cancel action and returns to the trigger on
 * close, and the destructive button shows a pending state while the server
 * action runs.
 */
export function ClearDataButton({
  transactionCount,
  customCategoryCount,
  disabled = false,
}: ClearDataButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Wrapping the server action lets a successful delete close the dialog
  // from within the action flow (never from a render effect).
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await clearAllDataAction(prevState, formData);
      if (result.savedAt) {
        setOpen(false);
        triggerRef.current?.focus();
      }
      return result;
    },
    {} as FormState,
  );

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Lock page scrolling while the dialog is open (no state is set here).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const transactionsLabel = `${transactionCount} stored ${
    transactionCount === 1 ? "transaction" : "transactions"
  }`;

  return (
    <div className="space-y-3">
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      {state.formError ? <Alert variant="error">{state.formError}</Alert> : null}

      <Button
        ref={triggerRef}
        type="button"
        variant="destructive"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden="true" />
        Clear all data
      </Button>
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          There is nothing to clear yet.
        </p>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-data-title"
            aria-describedby="clear-data-description"
            className="w-full max-w-md rounded-2xl border border-border bg-popover p-5 shadow-popover sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <TriangleAlert className="size-5" />
              </span>
              <div className="min-w-0">
                <h2
                  id="clear-data-title"
                  className="text-base font-semibold tracking-[-0.015em] text-foreground"
                >
                  Clear all data?
                </h2>
                <p
                  id="clear-data-description"
                  className="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  This permanently deletes{" "}
                  <span className="font-medium text-foreground">
                    all {transactionsLabel}
                  </span>
                  {customCategoryCount > 0 ? (
                    <>
                      {" "}
                      and{" "}
                      <span className="font-medium text-foreground">
                        {customCategoryCount} custom{" "}
                        {customCategoryCount === 1 ? "category" : "categories"}
                      </span>
                    </>
                  ) : (
                    " and any custom categories"
                  )}
                  . Default categories and your preferences (currency, theme)
                  are kept. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={pending}
                autoFocus
              >
                Cancel
              </Button>
              <form action={formAction}>
                <input type="hidden" name="confirm" value="delete-all" />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={pending}
                  className="w-full sm:w-auto"
                >
                  {pending ? (
                    <>
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                      Clearing…
                    </>
                  ) : (
                    <>
                      <Trash2 aria-hidden="true" />
                      Delete everything
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
