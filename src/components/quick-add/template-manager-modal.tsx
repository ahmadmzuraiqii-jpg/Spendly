"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import type { CategoryRow, Currency, TransactionType } from "@/db/types";
import type { TemplateListItem } from "@/lib/supabase/queries";
import {
  createTemplateAction,
  deleteTemplateAction,
} from "@/lib/actions/templates";
import type { FormState } from "@/lib/form-types";
import { formatSignedMoney } from "@/lib/money";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense", icon: ArrowDownRight },
  { value: "income", label: "Income", icon: ArrowUpRight },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

type TemplateManagerModalProps = {
  open: boolean;
  onClose: () => void;
  templates: TemplateListItem[];
  categories: CategoryRow[];
  currency: Currency;
};

/**
 * Create and delete quick-add templates. Follows the accessible modal
 * pattern used by "clear all data": `role="dialog"`, `aria-modal`, labelled
 * by its title and described by the intro text, Escape and backdrop clicks
 * close, and page scrolling is locked while it is open (the parent restores
 * focus to the trigger).
 *
 * The create form submits manually through `startTransition` — no function
 * `action` prop — so React never resets it mid-flight; fields are fully
 * controlled and cleared during render after a successful save (the same
 * "adjust state when a value changes" pattern the transaction form uses).
 */
export function TemplateManagerModal({
  open,
  onClose,
  templates,
  categories,
  currency,
}: TemplateManagerModalProps) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");

  // Clear the text fields for the next entry once a save succeeds; type
  // stays put because consecutive templates usually share it. (Render-time
  // state adjustment — no effect.)
  const [clearedAt, setClearedAt] = useState(0);
  if (state.savedAt && state.savedAt !== clearedAt) {
    setClearedAt(state.savedAt);
    setName("");
    setAmount("");
    setCategoryId("");
    setDescription("");
    setMerchant("");
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

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await createTemplateAction({} as FormState, formData));
    });
  }

  function selectType(nextType: TransactionType) {
    setType(nextType);
    const selected = categories.find(
      (category) => String(category.id) === categoryId,
    );
    if (selected && selected.type !== nextType) {
      setCategoryId("");
    }
  }

  function handleDelete(template: TemplateListItem) {
    const confirmed = window.confirm(
      `Delete the “${template.name}” template? Transactions you already logged from it are kept.`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      setState(await deleteTemplateAction(template.id));
    });
  }

  const visibleCategories = categories.filter(
    (category) => category.type === type,
  );

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
        aria-labelledby="tpl-manager-title"
        aria-describedby="tpl-manager-desc"
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl border border-border bg-popover shadow-popover"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5 pb-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="tpl-manager-title"
              className="text-base font-semibold tracking-[-0.015em] text-foreground"
            >
              Quick-add templates
            </h2>
            <p
              id="tpl-manager-desc"
              className="mt-1.5 text-sm leading-6 text-muted-foreground"
            >
              Save entries you log repeatedly, then add them from the Quick
              add bar with one tap. A template only creates a transaction
              when you tap it.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {state.success ? (
              <Alert variant="success">{state.success}</Alert>
            ) : null}
            {state.formError ? (
              <Alert variant="error">{state.formError}</Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  ref={nameRef}
                  id="tpl-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Netflix"
                  maxLength={40}
                  autoComplete="off"
                  aria-invalid={state.errors ? Boolean(state.errors.name) : undefined}
                  autoFocus
                />
                <FieldError message={state.errors?.name} />
              </div>

              <fieldset className="space-y-1.5 sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">
                  Type
                </legend>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-1">
                  {TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground",
                          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                          "has-[:checked]:bg-card has-[:checked]:text-foreground has-[:checked]:shadow-sm",
                        )}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={type === option.value}
                          onChange={() => selectType(option.value)}
                          className="sr-only"
                        />
                        <Icon className="size-4" aria-hidden="true" />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-amount">Amount</Label>
                <Input
                  id="tpl-amount"
                  name="amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="12.500"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={state.errors ? Boolean(state.errors.amount) : undefined}
                />
                <FieldError message={state.errors?.amount} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-category">Category</Label>
                <Select
                  id="tpl-category"
                  name="category_id"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  aria-invalid={
                    state.errors ? Boolean(state.errors.category_id) : undefined
                  }
                >
                  <option value="">Choose a category…</option>
                  {visibleCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <FieldError message={state.errors?.category_id} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-description">Description</Label>
                <Input
                  id="tpl-description"
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Monthly Netflix plan"
                  maxLength={200}
                  autoComplete="off"
                  aria-invalid={
                    state.errors ? Boolean(state.errors.description) : undefined
                  }
                />
                <FieldError message={state.errors?.description} />
                <p className="text-xs leading-5 text-muted-foreground">
                  Every transaction logged from this template uses this
                  description.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-merchant">
                  Merchant{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="tpl-merchant"
                  name="merchant"
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  placeholder="Netflix"
                  maxLength={120}
                  autoComplete="off"
                  aria-invalid={
                    state.errors ? Boolean(state.errors.merchant) : undefined
                  }
                />
                <FieldError message={state.errors?.merchant} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    Add template
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Saved templates
              </h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {templates.length}{" "}
                {templates.length === 1 ? "template" : "templates"}
              </span>
            </div>

            {templates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3.5 py-4 text-center text-sm text-muted-foreground">
                No templates yet — add your first one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {templates.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: template.category_color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {template.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {template.type === "income" ? "Income" : "Expense"} ·{" "}
                        {template.category_name} · {template.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletePending}
                      onClick={() => handleDelete(template)}
                      aria-label={`Delete ${template.name} template`}
                      title="Delete template"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
