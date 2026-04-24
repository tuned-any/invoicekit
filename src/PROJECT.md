# PROJECT.md — InvoiceKit

## What I Built

InvoiceKit is a lightweight invoicing and subscription mock micro-SaaS application built for freelancers. It lets users manage clients, create and send invoices with dynamic line items, track expenses, simulate recurring billing, export invoices as PDF or CSV, and view an audit trail of all actions. The app uses Supabase as its Backend-as-a-Service for authentication, database persistence, file storage, and serverless functions.

The application is a single-page React app (React + Vite) packaged in one file (`App.jsx`) that demonstrates component design, state management, authentication, routing, server communication, and BaaS integration.

---

## Features

- **Client Management** — Create, edit, and view clients with contact details. Each client card shows invoice count, total billed, and a portal link generator.
- **Invoice CRUD** — Create invoices with dynamic line items, per-invoice tax rate override, auto-calculated totals, and status tracking (Draft, Pending, Paid, Overdue). Mark invoices as Paid or Unpaid.
- **Invoice Detail & PDF Export** — Professional invoice layout with logo, Billed To / From cards, line item table, totals, payment info, and a decorative footer. Print-optimized CSS hides the sidebar and action bar for clean PDF output.
- **CSV Export** — Export a single invoice or the full invoice list as a downloadable CSV file.
- **Recurring Invoice Simulation** — In-memory templates with client, frequency, and amount. Click "Generate Invoice" to create a real persisted invoice from the template, simulating what an automated cron job would do in production.
- **Expense Tracking** — Track expenses by category with receipt uploads to Supabase Storage. Mark expenses as billable and convert them to invoice line items.
- **Audit Trail** — Automatic logging of every invoice action (created, updated, status changed, deleted) via a PostgreSQL trigger. Timeline UI with color-coded icons and detail pills.
- **Real-time Status Timeline** — Visual progress tracker on each invoice showing Created → Sent → Viewed → Paid with timestamps.
- **Auto-scheduled Reminders** — When an invoice is sent, reminder records are created in the database for before-due and overdue notifications.
- **Late Fee Settings** — Configurable late fee policy (percentage or flat, with grace period) stored in user profile.
- **Theme Customization** — 7 preset accent colors plus a custom hex picker. Theme propagates through React Context to every component.
- **Logo Upload** — Upload a company logo via FileReader, stored as base64, with a size slider for invoice display.
- **Multi-currency** — Supports CAD, USD, EUR, GBP, AUD, JPY, CHF, and NGN with locale-aware formatting.
- **Authentication** — Email/password sign-up and sign-in with Supabase Auth. Session persists across reloads via `onAuthStateChange`.

---

## AI and LLM Tools Disclosure

This project was built with the assistance of **Claude** (Anthropic). Claude was used for:

- Writing the Supabase database schema (migrations, RLS policies, and triggers)
- Implementing the camelCase ↔ snake_case mapping layer between React and PostgreSQL
- Building individual features (File import and export, Recurring, and part of Audit Trail)
- Debugging issues (missing tables, bare catch syntax, and some error handling)
- Writing Supabase Edge Functions (generate-recurring, send-reminders, API access)
- Generating a template for this documentation

All code was reviewed, tested, and integrated by the me. Claude provided some code guidance, but every feature was manually verified against the running application connected to a live Supabase instance.

---

## Data Management

### State Architecture

The app uses three React Contexts to separate concerns:

| Context | Purpose | State Type |
|---------|---------|------------|
| `AuthCtx` | User session, sign in/up/out, auth errors | Auth state |
| `DataCtx` | Invoices, clients, settings, CRUD actions | Server/remote state |
| `ThemeCtx` | Dynamic color palette derived from user settings | UI state |

**UI state** (form inputs, search filters, toggles, modal visibility) is managed with `useState` at the component level. This keeps transient interaction state local to the component that owns it.

**Server state** (invoices, clients, profile settings) lives in `DataCtx`. On mount, `DataProvider` fetches all user data from Supabase in parallel (`Promise.all`) and hydrates the context. CRUD actions update local state optimistically and then persist to Supabase.

**Derived state** (invoice totals, dashboard stats, filtered lists) is computed with `useMemo` to avoid recalculation on every render.

This separation was chosen because:
- Auth state needs to be globally accessible for route protection and user-scoped queries
- Server state needs a single source of truth with optimistic updates for responsiveness
- UI state is transient and component-specific, so lifting it to a global store would add unnecessary complexity

### Why React Context over Redux/Zustand

For an app of this size (single-file, ~1400 lines, 3 data entities), React Context provides sufficient global state management without adding a dependency. The three contexts have distinct responsibilities and don't cause unnecessary re-renders because consumers only subscribe to the context they need. In a larger production app, TanStack Query or Zustand would be more appropriate for cache invalidation and granular subscriptions.

---

## API / Backend-as-a-Service

### Supabase

I chose **Supabase** as the BaaS because it provides:

- **PostgreSQL database** — relational schema with foreign keys, constraints, generated columns, and triggers. This is important for invoice data where referential integrity matters (e.g., line items belong to invoices, invoices belong to clients).
- **Row Level Security (RLS)** — every table has RLS policies so users can only access their own data, enforced at the database level regardless of how the API is called.
- **Auth** — built-in email/password authentication with JWT sessions and `onAuthStateChange` for real-time session tracking.
- **Storage** — file uploads for expense receipts.
- **Edge Functions** — serverless Deno functions for automated tasks (recurring invoice generation, reminders).
- **Triggers** — PostgreSQL triggers for automatic profile creation on signup (`handle_new_user`) and audit logging on invoice changes (`log_invoice_change`).

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User settings (business info, tax, currency, theme, late fees, reminders) |
| `clients` | Client records with contact details and portal tokens |
| `invoices` | Invoice headers (number, dates, status, tracking timestamps) |
| `line_items` | Invoice line items (description, quantity, unit price) |
| `expenses` | Expense records with categories and receipt URLs |
| `reminders` | Scheduled reminder records (before-due, overdue) |
| `audit_log` | Automatic action log populated by trigger |

All tables use UUID primary keys, `user_id` foreign keys for ownership, and `created_at` timestamps.

---

## Backend Connection Strategy

### The `supabaseDb` Layer

The app communicates with Supabase through a dedicated abstraction layer called `supabaseDb`. This object contains methods for each entity (`profiles`, `clients`, `invoices`) that handle:

1. **camelCase ↔ snake_case mapping** — React uses camelCase (`invoiceNumber`, `dueDate`, `unitPrice`) while PostgreSQL uses snake_case (`invoice_number`, `due_date`, `unit_price`). The `supabaseDb` layer translates in both directions on every read and write.

2. **Query construction** — each method builds the appropriate Supabase query (`.select()`, `.insert()`, `.update()`, `.delete()`) with proper filters (`.eq('user_id', uid)`).

3. **Relationship handling** — `invoices.list()` uses `.select('*, line_items(*)')` to fetch invoices with their line items in a single query via Supabase's PostgREST join syntax.

4. **Error handling** — create operations check for errors and throw with descriptive messages.

The active database layer is assigned to `const db = supabaseDb`, and all `DataProvider` actions call through `db`. This design means swapping to a different backend would only require replacing the `supabaseDb` object.

### Data Flow

```
User Action → DataProvider action → Optimistic state update → supabaseDb method → Supabase REST API → PostgreSQL
```

For reads: `useEffect` on mount → `supabaseDb.list()` → map snake_case to camelCase → `setState`

For writes: action called → `setState` (optimistic) → `supabaseDb.create/update/delete()` → Supabase persists

### Authentication Flow

```
App mount → supabase.auth.getSession() → set user
         → supabase.auth.onAuthStateChange() → listen for session changes
Sign in  → supabase.auth.signInWithPassword() → session created → onAuthStateChange fires → user set → AuthGate renders app
Sign out → supabase.auth.signOut() → session cleared → AuthGate renders AuthScreen
```

Session tokens are managed by the Supabase client library and persisted in localStorage automatically. The `AuthGate` component checks `user` state: if null, it renders the auth screen; if present, it renders the authenticated app shell with router and data provider.

---

## Project Structure

The entire application lives in a single file (`src/App.jsx`). This is intentional for a course project — it makes the full architecture readable top-to-bottom without jumping between files, and simplifies sharing, reviewing, and submission.

```
invoicekit/
├── src/
│   ├── App.jsx        — All components, contexts, routing, DB layer, and pages
│   ├── App.css        — Global styles
│   ├── main.tsx       — Vite entry point (renders <App />)
│   └── Project.md     — Documentation
├── .env               — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
├── index.html         — Vite HTML template
├── package.json       — Dependencies (react, lucide-react, @supabase/supabase-js)
├── vite.config.ts     — Vite configuration
├── tsconfig.json      — TypeScript configuration (strict mode disabled)
└── PROJECT.md         — This documentation
```

When you run `npm run dev`, Vite serves `App.jsx` which contains everything in this order:

1. Icon imports and Supabase client initialization
2. Theme system (`makeTheme`, `ThemeCtx`)
3. `supabaseDb` layer (camelCase ↔ snake_case mapping for all CRUD operations)
4. Helper functions (`fmtC`, `fmtD`, `calcT`, `nextNum`, `genId`)
5. `AuthProvider` (sign in/up/out, session persistence)
6. `DataProvider` (invoices, clients, settings state + CRUD actions + reminder scheduling)
7. `RouterProvider` (client-side routing with history stack)
8. Atom components (`Btn`, `Inp`, `Card`, `Badge`)
9. `AuthScreen` (sign in/up form)
10. `Sidebar` (navigation)
11. Page components (Dashboard, Invoice List/Form/Detail, Clients, Recurring Simulation, Expenses, Audit Trail, Settings)
12. `AppShell` (layout wrapper with theme + sidebar + page rendering)
13. `App` export + `AuthGate` (root component that decides auth screen vs app shell)

### Component Hierarchy

```
App
└── AuthProvider
    └── AuthGate
        ├── AuthScreen (unauthenticated)
        └── RouterProvider (authenticated)
            └── DataProvider
                └── AppShell (ThemeCtx.Provider)
                    ├── Sidebar
                    └── [Page] (DashPage, InvListPage, InvFormPage, InvDetailPage,
                                ClientsPage, RecurringSimPage, ExpensesPage,
                                AuditTrailPage, SettingsPage)
```

---

## How to Run

```bash
git clone https://github.com/tuned-any/invoicekit.git
cd invoicekit
npm install
```

Create a `.env` file:

```
VITE_SUPABASE_URL=https://hrmtkvzattiegctjxilu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXRrdnphdHRpZWdjdGp4aWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDQzMDMsImV4cCI6MjA5MjEyMDMwM30.3YFlL6v583yWC-Eaco3x5IXiedNoQ26-WByyb7uXQHc

Run the migrations in Supabase SQL Editor, then:

```bash
npm run dev
```

---

## Deployment

Build for production:

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host. Set the environment variables in the hosting platform's dashboard.
