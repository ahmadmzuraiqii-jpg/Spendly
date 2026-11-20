"use client";

import { Input } from "@/components/ui/input";
import { RANGE_OPTIONS, type RangeId } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

type RangeFilterProps = {
  value: RangeId;
  customFrom: string;
  customTo: string;
  onChange: (value: RangeId) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
};

/**
 * Segmented date-range control. Switching a preset updates the whole
 * dashboard instantly (client state, no navigation); choosing "Custom"
 * reveals two date inputs whose values drive the same window maths.
 */
export function RangeFilter({
  value,
  customFrom,
  customTo,
  onChange,
  onCustomFromChange,
  onCustomToChange,
}: RangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex w-fit flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-card"
      >
        {RANGE_OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {value === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(event) => onCustomFromChange(event.target.value)}
            className="h-9 w-[9.75rem]"
          />
          <span className="text-sm text-muted-foreground" aria-hidden="true">
            to
          </span>
          <Input
            type="date"
            aria-label="To date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(event) => onCustomToChange(event.target.value)}
            className="h-9 w-[9.75rem]"
          />
        </div>
      ) : null}
    </div>
  );
}
