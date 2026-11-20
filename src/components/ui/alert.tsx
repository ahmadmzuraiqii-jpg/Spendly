import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertProps = {
  variant: "success" | "error";
  children: ReactNode;
  className?: string;
};

/** Inline success/error feedback used by every form and action. */
export function Alert({ variant, children, className }: AlertProps) {
  const Icon = variant === "success" ? CircleCheck : CircleAlert;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm leading-5",
        variant === "success"
          ? "border-success/25 bg-success/10 text-success"
          : "border-destructive/25 bg-destructive/10 text-destructive",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
