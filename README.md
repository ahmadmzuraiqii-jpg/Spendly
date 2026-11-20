# Spendly

A local-first personal finance dashboard for tracking income, expenses, and
spending habits. This repository is being built phase by phase from the
requirements in `prd.md.txt`.

**Current phase:** V1 (Phases 1–5) complete, Upgrade A complete, Upgrade B complete (master password protection).

## Stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and TypeScript
- **Tailwind CSS v4** with semantic CSS-variable tokens
- **SQLite** through `better-sqlite3`
- **Inter Variable** self-hosted with Fontsource
- **Recharts** for the dashboard's bar and doughnut charts
- **Lucide** icons and small, composable UI primitives

## Getting started

Requirements: Node.js 20.9 or newer (tested on Node 24) and npm.

```bash
npm install
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **PowerShell note:** if `npm` is blocked by the execution policy, use
> `npm.cmd` for every command (for example `npm.cmd run dev`).

`npm run dev` and `npm run build` also run `db:init` automatically through the
`predev` and `prebuild` scripts. `db:init` is idempotent: it applies only
migrations newer than the database's `PRAGMA user_version`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm run db:init` | Create or migrate the SQLite database and seed defaults |
| `npx tsx scripts/seed-demo.ts` | Optional dev-only demo data for the dashboard |

## Database

The database lives at `data/spendly.db` and is gitignored. Override the path
with `SPENDLY_DB_PATH` when running scripts or tests.

The schema is defined in `src/db/migrations/001_initial.sql`:

- **`categories`** — name, type (`income` / `expense`), color, icon, and
  default flag. Names are unique per type, case-insensitively.
- **`transactions`** — integer money, type, category, description, optional
  merchant, and calendar date. A composite foreign key guarantees that a
  transaction's type always matches its category's type, and `ON DELETE
  RESTRICT` prevents deleting a category that is still in use.
- **`settings`** — a single row holding the display currency (JOD by default)
  and light/dark theme.

Financial integrity choices:

- Amounts are stored as **integer minor units** at a fixed scale of three
  decimal places (`1 JOD = 1000` minor units). No floating-point money is
  stored or calculated.
- `transaction_date` is a plain `YYYY-MM-DD` calendar date, so it cannot shift
  with timezones. `created_at` and `updated_at` are UTC ISO-8601 timestamps.
- Indexes cover date, type/date, category/date, and amount queries.
- Triggers keep `updated_at` accurate.

The application connection is a singleton in `src/db/client.ts` with WAL mode,
foreign keys, and a busy timeout enabled.

## Design system

The design-system reference lives at [`/design`](/design) and shows the
palette, type scale, spacing, buttons, fields, badges, loading states, and
empty states.

- Tokens and base styles: `src/app/globals.css`
- Reusable primitives: `src/components/ui/`
- Theme toggle: `src/components/theme-toggle.tsx`
- Money formatting helper: `src/lib/money.ts`

Dark mode uses a `.dark` class on `<html>`. A tiny inline script applied in
the root layout runs the saved `localStorage` preference before paint to avoid
a flash, and the `(app)` layout follows it with a second script that applies
the database's `settings.theme` — the database is authoritative, and every
theme change (the header toggle or the settings page) writes both.

## Phase 2 — transactions and categories

The `(app)` route group wraps every screen in a responsive app shell (sidebar
on desktop, top bar on phones, 360px and up) with navigation between the
dashboard, transactions, categories, analytics, and settings.

### Transactions (`/transactions`)

- **Add income or expense** at `/transactions/new?type=income|expense`. The
  type toggle filters the category dropdown to matching categories and clears
  a mismatched selection; the server re-checks that a category's type matches
  the transaction, so a tampered form cannot bypass it.
- **Edit** at `/transactions/[id]/edit`; **delete** with a confirmation dialog
  first.
- The list shows description, category, date, type, signed amount, and row
  actions, rendered as a table on wider screens and cards on phones.
- Amounts accept `.` or `,` as the decimal separator, letters are rejected,
  and at most 3 decimal places are allowed (`12.3456` → validation error).
  Values are parsed from the input string and stored as integer minor units —
  no float math.
- Successful saves, edits, and deletes show a success banner; validation
  problems render inline field errors and never discard what you typed.

### Categories (`/categories`)

- Create, rename, recolor, re-icon, and delete income and expense categories.
- **In-use protection:** deleting a category still referenced by
  transactions is refused with a count of affected transactions
  (`ON DELETE RESTRICT` backs this up at the database level).
- **Duplicate names** are rejected case-insensitively per type, mapped from
  the UNIQUE constraint.
- Destructive actions ask for confirmation first; usage counts stay fresh on
  every load.

### How it works

- Server actions live in `src/lib/actions/` and are wired up with
  `useActionState`. Expected failures are returned as values; unexpected
  failures are caught and surfaced as friendly form errors.
- Create/edit flows stay on the page (banner + cleared form); deletes redirect
  with `?saved=` params so the confirmation banner renders on the list page.
- All app routes use `export const instant = false` plus `await connection()`
  so they always render against the live SQLite file at request time (the
  build prerenders the static design page at `/design`).

### Verified

`npm run typecheck`, `npm run lint`, and `npm run build` all pass. Browser
end-to-end checks covered: validation messages, create/edit/delete for both
transactions and categories (including canceling a delete confirmation),
integer minor-unit persistence, duplicate/in-use category errors, 404s for
unknown ids, dark-mode persistence, and layouts at 360px, 390px, and 1200px
with no horizontal overflow.

## Phase 3 — dashboard

The dashboard is the home screen at `/` and answers "how am I doing?" at a
glance. All of its maths lives in `src/lib/dashboard.ts`, a pure module that
only ever adds and subtracts **integer minor units** — the Net Balance can
never drift from floating-point error.

### Date ranges

- Presets: **This month**, **Last month**, **Last 3 months**, **This year**,
  and **Custom** (two date inputs).
- Every range carries an equal-shaped *previous* window for the comparison:
  month presets compare to the preceding calendar span, this year compares to
  the full previous year, and a custom range compares to the equally long
  span right before it.
- The range state lives in the client `DashboardView`, so switching a preset
  recomputes cards, charts, and the breakdown **instantly** — no navigation,
  no round trip.

### Summary cards

Total Income, Total Expenses, Net Balance, and Total Transactions, each with a
percentage change against the previous window. Percentages are computed with
integer math and kept in tenths of a percent, so a single rounding happens at
display time (income/expenses/net also colour the delta by polarity: more
income is green, more spending is red). When the previous window is empty the
card shows the comparison label instead of a meaningless percentage.

### Charts (Recharts)

- **Income vs expenses** — grouped bars over the last 6 calendar months, with
  a Monthly/Yearly toggle for the last 6 years. Series colours come from the
  `--income` / `--expense` design tokens via `fill="var(--income)"`, so the
  chart follows light/dark mode with no JavaScript.
- **Expense breakdown** — a doughnut of the selected window with a centre
  total, plus a legend showing each category's name, amount, and share of
  spending. Clicking a slice or a legend row opens
  `/transactions?category=<id>`, where a filter chip narrows the list and can
  be cleared.
- Both charts render an empty state when the window has nothing in it, and
  axis ticks are abbreviated for readability only (stored money is untouched).

### Recent transactions

The latest 10 entries with category, date, signed amount, and a **View all**
link through to the full list.

### Verified

`npm run typecheck`, `npm run lint`, and `npm run build` all pass. Browser
end-to-end checks compared every card against SQL sums for This month, Last
month, Last 3 months, and This year (values and all percentage deltas),
exercised the Monthly/Yearly toggle, custom date inputs, the empty-range
states, doughnut slice and legend clicks into the filtered transaction list
and back, quick-action links, `/design`, dark-mode chart colours, the active
nav state, and layouts at 360px, 390px, and 1200px with no horizontal
overflow — with zero console errors.

## Phase 4 — analytics

`/analytics` is a deeper, period-scoped view of the same data. It reuses the
date-range control and summary cards from the dashboard, so switching ranges
updates every number, chart, and observation instantly.

- **Monthly overview** — total income, expenses, net balance, and transaction
  count for the selected period, each compared against its previous window.
- **Spending trends** — income vs expenses as lines over the last 12 months
  (switchable to 24), plus a monthly net chart whose bars turn red whenever a
  month spent more than it earned. Series colours come from the `--income` /
  `--expense` tokens, so both charts follow light/dark mode without JS.
- **Category analysis** — the highest and lowest spending categories as
  highlight tiles, then every expense category with its total, share of
  spending, and a proportional bar.
- **Insights** — plain-language observations produced by
  `src/lib/analytics.ts`: conditional statements over SQLite values such as
  *"Your spending increased by 2.5% compared with last month"*, *"You kept
  75.7% of your income this period"*, *"Housing is your largest expense
  category (71.6% of your spending)"*, or *"You spent JOD 35.046 less on Bills
  & Utilities than last month."* **No external AI API is involved** — every
  sentence is arithmetic on integer minor units plus a rule, and the numbers
  it quotes match the cards next to it.

### Verified

`npm run typecheck`, `npm run lint`, and `npm run build` all pass (the build
now emits `/analytics` as a dynamic route). Browser end-to-end checks
compared the overview cards, category highs/lows, and all six rendered
insights against SQL sums for This month, Last month, and This year; exercised
the 12/24-month toggle, custom empty ranges (four empty states), a
deliberately overspending month to confirm the red net bar, dark-mode line
colours, active nav state on all four routes, and layouts from 360px through
1200px with no horizontal overflow — with zero console errors.

## Phase 5 — settings, export, and data management

`/settings` is the final MVP screen: preferences on the left, data management
on the right (a single column on phones).

### Display currency

- JOD (default), USD, EUR, GBP, or SAR — saved immediately on change.
- **Presentation only.** The action writes `settings.currency` and nothing
  else; no `amount_minor` value is ever read, converted, or rewritten. An
  expense of 100 stays 100 in the database and simply renders as `$100.00`
  from then on — a live preview next to the dropdown shows the rule in
  action. There is no currency conversion anywhere in the app.

### Appearance

- Light/dark radios apply instantly (no flash) and save on selection; the
  header's quick toggle writes the same `settings.theme` row, so the two
  controls always agree.
- The `(app)` layout injects the saved theme before paint, making the
  database authoritative while `localStorage` stays as the fast pre-paint
  path for the static `/design` page.

### Data management

- **Stored transaction count** and custom-category count, read live.
- **CSV export** via `GET /api/export`: every transaction with the columns
  `Date, Type, Category, Amount, Description`, RFC 4180 CRLF quoting, types
  capitalized (`Income`/`Expense`), and amounts written straight from the
  integer minor units at their stored 3-decimal precision — no symbol, no
  conversion, no float path. Served as `text/csv` with an `attachment`
  filename carrying today's date and `Cache-Control: no-store`.
- **Clear all data** behind an explicit warning modal (`role="dialog"`,
  Escape/backdrop/Cancel all cancel, focus starts on Cancel and returns to
  the trigger). The server action requires the `confirm=delete-all` token,
  deletes all transactions plus custom categories in one transaction, and
  keeps the default categories and your preferences. Every page
  revalidates immediately, so counts drop to 0, the export and clear
  buttons disable themselves with an explanation, and all screens show
  their empty states.

### Notes

- The preferences form submits through `onSubmit` + `startTransition`
  instead of `<form action>`: React 19 resets a form with a function action
  to its mount-time defaults after every submission, which would snap the
  select and radios back to their original values while the database
  already held the new ones. The same server action runs either way.
- Excluded per the PRD: live currency conversion, cloud sync/backups, and
  AI APIs.

### Verified

`npm run typecheck`, `npm run lint`, and `npm run build` all pass (the
build emits `/settings` and `/api/export` as dynamic routes; `/design`
stays static). Browser end-to-end checks covered: settings rendering with
the saved values, the currency cycle JOD→USD→EUR→GBP→JOD with the dashboard
switching symbols client-side while SQL sums stayed byte-identical, theme
flip/persistence/radio seeding, header-toggle ↔ settings-radio sync, CSV
response headers plus RFC 4180 escaping of quotes and commas (a synthetic
row round-tripped exactly), the export button downloading without
navigating, the clear-all modal's accessible structure and dismissal paths,
the destructive flow itself (216 rows + 1 custom category removed, counts
and buttons updating, empty states on all four screens, preferences kept),
and layouts from 360px through 1200px on every page with no horizontal
overflow — with zero console errors. The database was restored from a
verified backup afterwards (216 rows, ground-truth sums, 19 categories,
JOD/light).

## Upgrade A — one-click quick-add templates

For entries the user logs repeatedly (subscriptions, rent, salary), the
dashboard and transactions pages now carry a **Quick add** bar of template
pills — each showing the template name, its category color dot, and the
signed amount.

- **One tap = one real transaction.** Clicking a pill inserts a transaction
  dated today (`YYYY-MM-DD`) straight from the template via an
  `INSERT … SELECT`, so money stays integer minor units and the composite
  category/type foreign key still guards the row. The action revalidates the
  whole layout, so dashboard totals, charts, and the list refresh
  immediately, and the bar shows a confirmation banner.
- **Log all** (shown from two templates up) opens an explicit confirmation
  dialog and creates a transaction for every saved template in a single
  database statement, gated by a `confirm=log-all` token server-side.
- **Management** lives in an accessible modal opened from the bar: create a
  template (name, type, amount, category filtered by type, description,
  optional merchant — validated with the same rules as transactions, plus a
  case-insensitive unique name) and delete one (confirmation first;
  transactions already logged from it are kept).
- **Empty state**: with no templates the bar explains the feature and links
  straight into creation.
- **Schema**: migration `002_templates.sql` adds `transaction_templates`
  with `amount_minor` as a positive integer, a composite
  `(category_id, type) → categories(id, type)` FK with `ON DELETE CASCADE`,
  and `UNIQUE (name)`. `npm run db:init` discovers and applies it
  automatically in one transaction with `PRAGMA user_version = 2`, skips it
  on later runs, and never touches existing data.

### Verified

`npm run db:init` (applies 002, then reports "up to date" on re-run),
`npm run typecheck`, `npm run lint`, and `npm run build` all pass. Browser
end-to-end checks covered the empty state; template creation with inline
validation errors (empty fields, case-insensitive duplicate name); integer
minor-unit persistence in SQLite; pill logging with the confirmation banner
and dashboard totals moving by exactly the logged amounts (matching SQL
sums); Log all via its accessible confirmation dialog (Escape cancels
first); template deletion keeping every logged transaction and returning
the empty state; the transactions page showing each logged row; the bar
and modal at 360px/768px/1200px (no horizontal overflow, pills wrap,
fields stack, dialog fits and scroll-locks); focus restoration after
Escape; and zero console errors throughout — with the database verified
back to its exact pre-E2E snapshot afterwards.

## Project structure

```text
scripts/
  init-db.ts              # Idempotent migration runner and seed check
  seed-demo.ts            # Optional dev-only dashboard demo data
src/
  app/
    globals.css           # Design tokens, dark mode, base styles
    layout.tsx            # Fonts, metadata, theme bootstrap
    design/page.tsx       # Phase 1 design-system reference
    (app)/                # Route group wrapped in the app shell
      layout.tsx          # Blocking (request-time) segment for live SQLite
      page.tsx            # Dashboard (Phase 3 home screen)
      analytics/          # Analytics page (Phase 4)
      settings/           # Settings page (Phase 5)
      transactions/       # List, new, and [id]/edit pages
      categories/         # Management grid and [id]/edit page
    api/
      export/route.ts     # GET CSV download of every transaction
  components/
    ui/                   # Button, Card, Input, Select, Badge, etc.
    analytics/            # Trend/net charts, category analysis, insights
    dashboard/            # Range filter, cards, charts, recent list
    quick-add/            # Quick-add bar, template modal, Log-all dialog
    settings/             # SettingsView and the clear-data confirm modal
    app-shell.tsx         # Responsive sidebar / mobile-header shell
    site-nav.tsx, brand.tsx, theme-toggle.tsx
    page-header.tsx, alert.tsx
    transaction-form.tsx, transaction-list.tsx
    category-form.tsx, category-panel.tsx
    delete-*.tsx          # Confirm-dialog delete buttons
  db/
    client.ts             # Server-only SQLite singleton
    config.ts             # Database path resolution
    types.ts              # Row and domain types
    queries.ts            # Typed reads and writes used by pages/actions
    migrations/
      001_initial.sql     # Schema, indexes, triggers, and seed data
      002_templates.sql   # Quick-add transaction templates (Upgrade A)
  lib/
    actions/              # Server actions (transactions, categories, settings, templates)
    analytics.ts          # Rule-based insights and category analysis
    dashboard.ts          # Pure date-window, sum, and percentage maths
    csv.ts                # RFC 4180 serialization for the CSV export
    money.ts              # Integer-minor-unit formatting and parsing
    theme.ts              # Client-side theme application/persistence
    validation.ts         # Form parsing and field-error messages
    dates.ts, form-types.ts, utils.ts
data/                     # Local SQLite database (gitignored)
```

## Phase 1 scope (done)

Included:

- Next.js, TypeScript, Tailwind, ESLint, and path aliases
- SQLite schema, migration runner, seed categories, and connection helper
- Design tokens, light/dark themes, typography, and core UI primitives
- A live design-system reference page

## Phase 2 scope (done)

Included:

- Add, edit, and delete income/expense transactions with validation messages
- Transaction list (description, category, date, type, amount, actions) that
  switches between table and card layouts
- SQLite persistence using integer minor units
- Category management: create, rename, color, icon, delete — with in-use
  protection, duplicate-name detection, and confirmation before deletion
- Success/error notifications for every completed or failed action
- Responsive app shell (360px → desktop) with light/dark theming

## Phase 3 scope (done)

Included:

- Dashboard at `/` with Total Income, Total Expenses, Net Balance, and Total
  Transactions, each compared against the previous period as a percentage
- Income vs expenses bar chart (last 6 months, with a Monthly/Yearly toggle)
  and an expense-breakdown doughnut with name/amount/percentage legend
- Date-range presets plus a custom range that instantly recompute every card
  and chart
- Recent-transactions mini-list and quick actions (add income, add expense,
  view transactions)
- Category drill-down from a chart into a filtered transaction list
- Empty states for windows with no data

## Phase 4 scope (done)

Included:

- Analytics page at `/analytics` with a monthly overview (income, expenses,
  net, transaction count) compared against the previous period
- Spending trends over the last 12 or 24 months, plus a signed monthly net
  chart (red when a month spent more than it earned)
- Category analysis: highest and lowest spending categories, per-category
  totals, and each one's percentage of total expenses
- Rule-based insights computed in TypeScript from SQLite data — no AI APIs
- Active Analytics state in the sidebar and the mobile top navigation

## Phase 5 scope (done)

Included:

- Settings screen at `/settings` with a display-currency selector (JOD,
  USD, EUR, GBP, SAR) that changes only the symbol — stored amounts are
  never converted — and an immediate-save light/dark appearance toggle
- Theme persisted in `settings.theme` and applied before paint on every
  app page, shared with the header's quick toggle
- Stored transaction count, CSV export of all transactions
  (`Date, Type, Category, Amount, Description`), and clear-all-data behind
  an explicit warning modal with a server-side confirmation token
- Settings added to the sidebar and mobile navigation; responsive polish
  pass across every page from 360px to 1200px

Out of scope for this version (per the PRD): live currency conversion,
cloud synchronization or online backups, and AI APIs.

## Upgrade A scope (done)

Included:

- `transaction_templates` table (migration 002, applied automatically by
  `db:init`) with integer minor-unit amounts, a composite category/type
  foreign key with `ON DELETE CASCADE`, and unique names
- Quick add bar on the dashboard and transactions page: template pills with
  name, category color dot, and signed amount; one tap logs a real
  transaction dated today and every total/chart refreshes immediately
- Log all with an explicit confirmation dialog (all templates, one
  transaction, server-side confirmation token)
- Template management modal from the bar: create (name, type, amount,
  category, description, optional merchant) with inline validation, and
  delete with confirmation
- Graceful empty state that doubles as the first-template entry point

Not yet included (next step, per plan): login/password protection.
