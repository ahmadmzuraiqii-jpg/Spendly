import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Database,
  Inbox,
  MousePointerClick,
  Palette,
  Plus,
  Type,
  Wallet,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const colorTokens = [
  { label: "Canvas", token: "bg-background", className: "bg-background" },
  { label: "Surface", token: "bg-card", className: "bg-card" },
  { label: "Primary", token: "bg-primary", className: "bg-primary" },
  { label: "Accent", token: "bg-accent", className: "bg-accent" },
  { label: "Teal", token: "bg-accent-strong", className: "bg-accent-strong" },
  { label: "Income", token: "bg-income", className: "bg-income" },
  { label: "Expense", token: "bg-expense", className: "bg-expense" },
  { label: "Muted", token: "bg-muted", className: "bg-muted" },
  { label: "Border", token: "bg-border", className: "bg-border" },
];

const chartTokens = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
];

const tables = [
  {
    name: "categories",
    label: "Master data",
    columns: "id · name · type · color · icon · is_default",
    note: "Income and expense categories with case-insensitive unique names and a color used consistently in charts.",
  },
  {
    name: "transactions",
    label: "Ledger",
    columns: "id · amount_minor · type · category_id · date · merchant",
    note: "Integer money, calendar dates, and indexes for date, type, category, and amount queries.",
  },
  {
    name: "settings",
    label: "Preferences",
    columns: "id · currency · theme",
    note: "One row only: JOD by default, with light or dark appearance. Stored amounts never change with currency.",
  },
];

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
        <Icon className="size-3.5" aria-hidden="true" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">
              Design foundation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">Phase 1</Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-accent-strong" />
              Phase 1 · Project foundation
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04]">
              A calm, clear home for your money.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Spendly pairs a local SQLite ledger with a restrained design
              system built for clarity. This phase establishes the tokens, type,
              and primitives every screen will share.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#components">
                  Explore components
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#database">View data foundation</a>
              </Button>
            </div>
          </div>

          <Card className="relative overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Foundation preview</CardTitle>
                <Badge variant="outline">Static sample</Badge>
              </div>
              <CardDescription>
                Tokens and primitives rendered together.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-lg bg-sidebar p-5 text-sidebar-foreground">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
                  Net balance
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em]">
                  {formatMoney(2_480_750)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-sidebar-muted">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-sidebar-foreground">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    12.4%
                  </span>
                  <span>vs. last month</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Income
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-income">
                    {formatMoney(3_900_000)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Expenses
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-expense">
                    {formatMoney(1_419_250)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Wallet className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      Groceries
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Food &amp; Dining
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-expense">
                  −{formatMoney(42_500)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="color" className="mt-20 scroll-mt-24 sm:mt-24">
          <SectionHeading
            icon={Palette}
            eyebrow="Color"
            title="A restrained, semantic palette"
            description="Deep navy anchors the interface, teal carries the accent, and income and expense colors are reserved for meaning — not decoration."
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Semantic tokens</CardTitle>
              <CardDescription>
                Every surface, border, and state reads from a shared token that
                adapts in dark mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {colorTokens.map((color) => (
                  <div
                    key={color.token}
                    className="rounded-lg border border-border bg-background p-2"
                  >
                    <div
                      className={cn(
                        "h-14 rounded-md border border-border/60",
                        color.className,
                      )}
                    />
                    <p className="mt-2 text-xs font-medium text-foreground">
                      {color.label}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                      {color.token}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Chart palette
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eight category-safe hues for charts and breakdowns.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {chartTokens.map((token, index) => (
                    <span
                      key={token}
                      className={cn("size-7 rounded-full", token)}
                      title={`chart-${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="typography" className="mt-20 scroll-mt-24 sm:mt-24">
          <SectionHeading
            icon={Type}
            eyebrow="Typography"
            title="Inter, tuned for numbers"
            description="A single variable family keeps the interface coherent. Tabular figures keep financial columns aligned as values change."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Type scale</CardTitle>
                <CardDescription>
                  Tight tracking on display text, generous line height for body
                  copy, and tabular numbers for every amount.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Display
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      48 / 600
                    </span>
                  </div>
                  <p className="mt-1 text-4xl font-semibold tracking-[-0.045em] text-foreground">
                    Clarity over clutter.
                  </p>
                </div>

                <div className="border-t border-border pt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Heading
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      24 / 600
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    Monthly overview
                  </p>
                </div>

                <div className="border-t border-border pt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Body
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      16 / 400
                    </span>
                  </div>
                  <p className="mt-1 max-w-xl text-base leading-7 text-muted-foreground">
                    Understand where your money goes without deciphering a
                    spreadsheet. Every summary should answer a question at a
                    glance.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/60 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Tabular numbers
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">
                    {formatMoney(12_480_500)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Space, radius, elevation</CardTitle>
                <CardDescription>
                  Soft 12–20px corners, generous spacing, and shadows that
                  suggest depth without noise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Radius
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[
                      { label: "lg", className: "rounded-lg" },
                      { label: "xl", className: "rounded-xl" },
                      { label: "2xl", className: "rounded-2xl" },
                    ].map((radius) => (
                      <div
                        key={radius.label}
                        className={cn(
                          "grid h-16 place-items-center border border-border bg-background text-xs font-medium text-muted-foreground",
                          radius.className,
                        )}
                      >
                        {radius.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Elevation
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                      <p className="text-xs font-medium text-foreground">
                        Raised
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        shadow-sm
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                      <p className="text-xs font-medium text-foreground">
                        Card
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        shadow-card
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Focus
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="ring-2 ring-ring ring-offset-2 ring-offset-background"
                    >
                      Visible focus ring
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Keyboard first
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="components" className="mt-20 scroll-mt-24 sm:mt-24">
          <SectionHeading
            icon={MousePointerClick}
            eyebrow="Components"
            title="A small, composable kit"
            description="Buttons, fields, badges, loading states, and empty states share the same tokens — so new screens feel familiar from day one."
          />

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  One primary action per view. Secondary, outline, ghost, and
                  destructive variants cover the rest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button type="button">Primary</Button>
                  <Button type="button" variant="secondary">
                    Secondary
                  </Button>
                  <Button type="button" variant="outline">
                    Outline
                  </Button>
                  <Button type="button" variant="ghost">
                    Ghost
                  </Button>
                  <Button type="button" variant="destructive">
                    Delete
                  </Button>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Sizes
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button type="button" size="sm">
                      Small
                    </Button>
                    <Button type="button">Default</Button>
                    <Button type="button" size="lg">
                      Large
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      aria-label="Add transaction"
                    >
                      <Plus aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button type="button" disabled>
                    Disabled
                  </Button>
                  <Button asChild variant="link">
                    <a href="#database">
                      Link button
                      <ArrowRight aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form fields</CardTitle>
                <CardDescription>
                  Comfortable targets, a visible focus ring, and a clear invalid
                  state. Labels never rely on placeholder text alone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Label</Label>
                  <Input id="demo-input" placeholder="Enter a value" />
                  <p className="text-xs text-muted-foreground">
                    Supporting text explains the expected value.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-select">Select</Label>
                    <Select id="demo-select" defaultValue="one">
                      <option value="one">Option one</option>
                      <option value="two">Option two</option>
                      <option value="three">Option three</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-amount">Amount</Label>
                    <Input
                      id="demo-amount"
                      inputMode="decimal"
                      placeholder="0.000"
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-notes">Notes</Label>
                  <Textarea
                    id="demo-notes"
                    rows={3}
                    placeholder="Add context for this entry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-error">Error state</Label>
                  <Input
                    id="demo-error"
                    aria-invalid="true"
                    defaultValue="Invalid value"
                  />
                  <p className="text-xs text-destructive">
                    This field needs attention before it can be saved.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>
                  Compact labels for type and state, plus a calm skeleton for
                  loading views.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="income">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    Income
                  </Badge>
                  <Badge variant="expense">
                    <ArrowDownRight className="size-3" aria-hidden="true" />
                    Expense
                  </Badge>
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Loading
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-5/6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empty state</CardTitle>
                <CardDescription>
                  Quiet, useful, and never a dead end. Every empty list gets an
                  explanation and a next step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Inbox}
                  title="No transactions yet"
                  description="When you add your first income or expense, it will appear here. Empty states are part of the shared kit."
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="database" className="mt-20 scroll-mt-24 sm:mt-24">
          <SectionHeading
            icon={Database}
            eyebrow="Data foundation"
            title="A small, durable data layer"
            description="A single local SQLite file, three tables, and constraints that protect financial integrity. No accounts, no cloud, no floating-point money."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {tables.map((table) => (
              <Card key={table.name} className="shadow-none">
                <CardHeader className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="font-mono text-sm">
                      {table.name}
                    </CardTitle>
                    <Badge variant="outline">{table.label}</Badge>
                  </div>
                  <CardDescription className="pt-1">
                    {table.note}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="font-mono text-[11px] leading-5 text-muted-foreground">
                    {table.columns}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-sidebar p-6 text-sidebar-foreground sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
              <Database className="size-4" aria-hidden="true" />
              SQLite · schema v1
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  3
                </p>
                <p className="mt-1 text-xs text-sidebar-muted">tables</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  18
                </p>
                <p className="mt-1 text-xs text-sidebar-muted">
                  default categories
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  1000
                </p>
                <p className="mt-1 text-xs text-sidebar-muted">
                  minor units per JOD
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-sidebar-muted">
              Amounts are integers at a fixed three-decimal scale. Transaction
              dates are plain calendar dates with no timezone. The database
              lives in{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-sidebar-foreground">
                data/spendly.db
              </code>{" "}
              and persists across restarts.
            </p>
          </div>
        </section>

        <footer className="mt-20 border-t border-border pt-8">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Spendly · Phase 1 foundation</p>
            <p>Next.js · SQLite · Tailwind CSS</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
