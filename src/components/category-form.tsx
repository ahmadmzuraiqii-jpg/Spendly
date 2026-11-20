"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/categories";
import type { CategoryType } from "@/db/types";
import type { FormState } from "@/lib/form-types";
import { CATEGORY_ICON_SLUGS, getCategoryIcon } from "@/lib/category-icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#E07A5F",
  "#D9534F",
  "#D65A8C",
  "#A06CD5",
  "#5C6BC0",
  "#4C7DF0",
  "#2A9D8F",
  "#3F9D6B",
  "#E39B2E",
  "#B5813C",
  "#6B7A99",
  "#8A8F98",
];

type CategoryFormProps = {
  type: CategoryType;
  categoryId?: number;
  initial?: { name: string; color: string; icon: string };
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CategoryForm({ type, categoryId, initial }: CategoryFormProps) {
  const isEdit = Boolean(categoryId);

  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? "#4C7DF0");
  const [icon, setIcon] = useState(initial?.icon ?? "circle-ellipsis");

  const [state, formAction, pending] = useActionState(
    isEdit ? updateCategoryAction : createCategoryAction,
    {} as FormState,
  );

  // Clear the name after a successful create so another category can be
  // added right away, while keeping the chosen color and icon.
  const [clearedAt, setClearedAt] = useState(0);
  if (!isEdit && state.savedAt && state.savedAt !== clearedAt) {
    setClearedAt(state.savedAt);
    setName("");
  }

  const submitLabel = pending
    ? "Saving…"
    : isEdit
      ? "Save changes"
      : `Add ${type} category`;

  return (
    <form action={formAction} className="space-y-4">
      {categoryId ? <input type="hidden" name="id" value={categoryId} /> : null}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="icon" value={icon} />

      {state.formError ? <Alert variant="error">{state.formError}</Alert> : null}
      {state.success ? (
        <Alert variant="success">{state.success}</Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          placeholder={type === "income" ? "e.g. Consulting" : "e.g. Pets"}
          maxLength={40}
          autoComplete="off"
          value={name}
          aria-invalid={Boolean(state.errors?.name)}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldError message={state.errors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-color">Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="category-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
              aria-label="Category color"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Use color ${preset}`}
                  aria-pressed={color.toLowerCase() === preset.toLowerCase()}
                  onClick={() => setColor(preset)}
                  className={cn(
                    "size-6 rounded-full ring-1 ring-inset ring-black/10 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                    color.toLowerCase() === preset.toLowerCase() &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>
          <FieldError message={state.errors?.color} />
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <div
            role="radiogroup"
            aria-label="Category icon"
            className="grid max-h-[7.5rem] grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2 sm:grid-cols-10"
          >
            {CATEGORY_ICON_SLUGS.map((slug) => {
              const Icon = getCategoryIcon(slug);
              const isActive = icon === slug;
              return (
                <button
                  key={slug}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={slug.replace(/-/g, " ")}
                  title={slug.replace(/-/g, " ")}
                  onClick={() => setIcon(slug)}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <FieldError message={state.errors?.icon} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
        {isEdit ? (
          <Button asChild variant="outline">
            <Link href="/categories">Cancel</Link>
          </Button>
        ) : null}
        <Button type="submit" disabled={pending} className="sm:min-w-36">
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
