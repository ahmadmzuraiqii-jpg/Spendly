import Link from "next/link";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const isSidebar = variant === "sidebar";

  return (
    <Link
      href="/"
      aria-label="Spendly home"
      className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        className={cn(
          "relative grid size-9 shrink-0 place-items-center rounded-[11px] shadow-sm",
          isSidebar
            ? "bg-white/10 text-sidebar-foreground ring-1 ring-white/10"
            : "bg-primary text-primary-foreground",
        )}
      >
        <Wallet className="size-[18px]" strokeWidth={2.1} aria-hidden="true" />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 bg-accent-strong",
            isSidebar ? "border-sidebar" : "border-background",
          )}
        />
      </span>
      <span
        className={cn(
          "text-[17px] font-semibold tracking-[-0.02em] max-[379px]:hidden md:hidden lg:inline",
          isSidebar ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        Spendly
      </span>
    </Link>
  );
}
