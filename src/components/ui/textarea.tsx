import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[color,background-color,border-color,box-shadow] duration-150",
        "placeholder:text-muted-foreground selection:bg-accent selection:text-accent-foreground",
        "hover:border-input/80",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
