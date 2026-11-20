"use client";

import {
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Database, Download, LoaderCircle, Moon, Sun, Trash2 } from "lucide-react";
import type { Currency, Theme } from "@/db/types";
import { saveSettingsAction } from "@/lib/actions/settings";
import type { FormState } from "@/lib/form-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ClearDataButton } from "@/components/settings/clear-data-button";
import { formatMoney, MINOR_UNITS_PER_MAJOR } from "@/lib/money";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "JOD", label: "JOD — Jordanian Dinar" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

type SettingsViewProps = {
  currency: Currency;
  theme: Theme;
  transactionCount: number;
  customCategoryCount: number;
};

/**
 * The Settings screen. Both preferences save immediately on change: the
 * control updates optimistically, the form submits itself, and the server
 * action persists the value and revalidates the whole layout so every page
 * picks up the new display currency.
 *
 * The currency is presentation-only. Nothing here — and nothing in the
 * action it posts to — reads `amount_minor`; changing JOD to USD changes the
 * symbol, never the stored number.
 */
export function SettingsView({
  currency: currencyProp,
  theme: themeProp,
  transactionCount,
  customCategoryCount,
}: SettingsViewProps) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // This form deliberately does NOT use `action={fn}`. React 19 resets a
  // form with a function action to its *mount-time* defaults after every
  // submission (the form fiber is flagged and `form.reset()` runs), which
  // would snap the select and radios back to their original values while the
  // database already has the new ones. Submitting manually through
  // `startTransition` runs the exact same server action — persisting and
  // revalidating — without arming that reset, so the controls keep the
  // values the user just picked.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await saveSettingsAction(state, formData));
    });
  }

  // The select and radios are uncontrolled: the native DOM element owns the
  // picked value, and this mirror of it only drives the live currency
  // preview. Server values seed them via defaultValue/defaultChecked on
  // mount; the theme group is keyed on the server value so an external
  // change (the header toggle) re-checks the right radio.
  const [currency, setCurrency] = useState<Currency>(currencyProp);

  function saveNow() {
    formRef.current?.requestSubmit();
  }

  function handleCurrencyChange(event: ChangeEvent<HTMLSelectElement>) {
    setCurrency(event.target.value as Currency);
    saveNow();
  }

  function handleThemeChange(event: ChangeEvent<HTMLInputElement>) {
    // Visible immediately — no flash while the server action runs.
    applyTheme(event.target.value as Theme);
    saveNow();
  }

  // Live proof of the non-conversion rule: the same stored amount, restyled.
  const preview = formatMoney(100 * MINOR_UNITS_PER_MAJOR, currency);
  const hasNothingToClear =
    transactionCount === 0 && customCategoryCount === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* ---------------------------------------------------------- */}
      {/* Preferences: currency + appearance                          */}
      {/* ---------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Saved automatically the moment you change an option.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {state.success ? (
              <Alert variant="success">{state.success}</Alert>
            ) : null}
            {state.formError ? (
              <Alert variant="error">{state.formError}</Alert>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="settings-currency"
                className="text-sm font-medium text-foreground"
              >
                Display currency
              </label>
              <Select
                id="settings-currency"
                name="currency"
                defaultValue={currencyProp}
                onChange={handleCurrencyChange}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  Changes the symbol only — stored amounts are never
                  converted. An expense of 100 stays 100 in the database; it
                  simply displays as{" "}
                  <span className="font-medium text-foreground">{preview}</span>{" "}
                  from now on.
                </p>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                Appearance
              </legend>
              <div
                key={themeProp}
                className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-1"
              >
                {THEME_OPTIONS.map((option) => {
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
                        name="theme"
                        value={option.value}
                        defaultChecked={option.value === themeProp}
                        onChange={handleThemeChange}
                        className="sr-only"
                      />
                      <Icon className="size-4" aria-hidden="true" />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Your choice is remembered for your next visit.
              </p>
            </fieldset>

            <div className="flex h-5 items-center gap-2 text-xs text-muted-foreground">
              {pending ? (
                <>
                  <LoaderCircle
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------- */}
      {/* Data: count, CSV export, clearing                           */}
      {/* ---------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>
            Everything is stored locally in SQLite on this computer.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-border"
                aria-hidden="true"
              >
                <Database className="size-4" />
              </span>
              <span className="text-sm text-muted-foreground">
                Stored transactions
              </span>
            </div>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {transactionCount.toLocaleString("en-US")}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {transactionCount > 0 ? (
              <Button asChild variant="outline">
                <a href="/api/export" download title="Download a .csv file">
                  <Download aria-hidden="true" />
                  Export CSV
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Download aria-hidden="true" />
                Export CSV
              </Button>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              {transactionCount > 0
                ? `Date, Type, Category, Amount, Description — all ${transactionCount.toLocaleString("en-US")} rows.`
                : "Available once you have transactions to export."}
            </p>
          </div>

          <div className="space-y-3 border-t border-destructive/20 pt-5">
            <div className="flex items-start gap-2.5">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <Trash2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Danger zone
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  Delete every transaction and any custom categories. You will
                  be asked to confirm first; default categories and your
                  preferences are kept.
                </p>
              </div>
            </div>

            <ClearDataButton
              transactionCount={transactionCount}
              customCategoryCount={customCategoryCount}
              disabled={hasNothingToClear}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
