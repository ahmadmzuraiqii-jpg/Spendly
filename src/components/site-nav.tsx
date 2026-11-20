"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Settings,
  Tags,
} from "lucide-react";
import { LockButton } from "@/components/lock-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  // The dashboard owns the root path; `startsWith("/")` would match all.
  if (href === "/") return pathname === "/";
  if (href === "/transactions") {
    return pathname === href || pathname.startsWith("/transactions");
  }
  return pathname === href || pathname.startsWith(href);
}

export function SiteNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav aria-label="Main" className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2.5",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {/* Labels appear once there is room; phones show icons. */}
              <span className="hidden md:inline">{item.label}</span>
              <span className="sr-only md:hidden">{item.label}</span>
            </Link>
          );
        })}
        <LockButton orientation="horizontal" />
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              active
                ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
      <LockButton orientation="vertical" />
    </nav>
  );
}
