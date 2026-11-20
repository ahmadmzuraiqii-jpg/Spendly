"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/lib/actions/categories";
import type { FormState } from "@/lib/form-types";
import { Button } from "@/components/ui/button";

export function DeleteCategoryButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteCategoryAction,
    {} as FormState,
  );

  return (
    <div className="relative">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            `Delete the category "${name}"? This cannot be undone.`,
          );
          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label={`Delete ${name}`}
          title="Delete"
          className="text-muted-foreground hover:text-destructive"
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 aria-hidden="true" />
          )}
        </Button>
      </form>

      {state.formError ? (
        <div
          role="alert"
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-destructive/30 bg-card px-3 py-2 text-xs leading-4 text-destructive shadow-popover"
        >
          {state.formError}
        </div>
      ) : null}
    </div>
  );
}
