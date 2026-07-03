# Uncapped.gg Work Log

This file tracks implementation work for the Uncapped.gg SaaS project.

## 2026-07-03 - Project Start

- Task: Start Release 1 implementation for the Uncapped.gg multi-shop SaaS MVP.
- Repo: `https://github.com/theyoungking15/uncapped.gg.git`
- Decision: Build as a standalone Next.js + Supabase app, separate from the Shopify workspace.
- Decision: Release 1 focuses on shop profiles, admin dashboard, Google Sheets published CSV import, public price list, quote request form, and quote inbox.
- Decision: PC Builder, compatibility rules, shop branding, share links, bundle/promos, FPS Finder, and delivery/map APIs are later phases.
- Safety note: Do not delete or mutate files in the existing Shopify repo for this project.
- Open issue: Supabase project values and database migration are still needed before testing against real shop data.

## 2026-07-03 - Release 1 Scaffold

- Task: Implement the first Uncapped.gg SaaS MVP scaffold.
- Files changed:
  - Added Next.js/TypeScript project config: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.env.example`.
  - Added app routes for landing, login, admin overview, settings, imports, products, quotes, public shop profile, and public price list.
  - Added shared libraries for category normalization, money/date formatting, CSV parsing, Supabase clients, and data access.
  - Added server actions for email login, shop profile save, Google Sheets published CSV import, public quote submission, quote status update, and sign out.
  - Added Supabase migration `supabase/migrations/202607030001_initial_schema.sql`.
- Behavior added:
  - Shop owners can sign in by email magic link.
  - Shop owners can create a shop profile with Facebook Page and Messenger links.
  - Shop owners can import products from a published Google Sheets CSV URL.
  - Imported products are grouped with PC Builder-compatible category keys.
  - Public shop pages expose shop profile and price list routes.
  - Customers can select product quantities and submit a quote request.
  - Shop owners can review quotes and update quote status.
- Tests run:
  - `npm install`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Open issues:
  - Supabase project values still need to be added to `.env.local`.
  - The initial migration still needs to be applied in Supabase.

## 2026-07-03 - Local Node Setup And Verification

- Task: Install local Node/npm tooling and verify the scaffold.
- Environment:
  - Installed Node.js LTS with `winget`.
  - Used `npm.cmd` directly because PowerShell blocks unsigned `npm.ps1` scripts by default.
- Files changed:
  - Added `package-lock.json` from `npm install`.
  - Added `.gitignore` entry for `tsconfig.tsbuildinfo`.
  - Updated `eslint.config.mjs` to avoid anonymous default export lint warnings.
  - Typed the Supabase cookie adapter in `src/lib/supabase.ts`.
  - Added a `postcss` package override to resolve the moderate `npm audit` advisory pulled through Next.js.
- Tests run:
  - `npm install`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm audit --audit-level=moderate`
- Result:
  - Typecheck, lint, production build, and audit passed locally.
- Open issues:
  - Supabase project values still need to be added to `.env.local`.
  - The initial migration still needs to be applied in Supabase.
