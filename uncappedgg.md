# Uncapped.gg Work Log

This file tracks implementation work for the Uncapped.gg SaaS project.

## 2026-07-03 - Project Start

- Task: Start Release 1 implementation for the Uncapped.gg multi-shop SaaS MVP.
- Repo: `https://github.com/theyoungking15/uncapped.gg.git`
- Decision: Build as a standalone Next.js + Supabase app, separate from the Shopify workspace.
- Decision: Release 1 focuses on shop profiles, admin dashboard, Google Sheets published CSV import, public price list, quote request form, and quote inbox.
- Decision: PC Builder, compatibility rules, shop branding, share links, bundle/promos, FPS Finder, and delivery/map APIs are later phases.
- Safety note: Do not delete or mutate files in the existing Shopify repo for this project.
- Open issue: Node/npm are not currently available in this shell, so dependency install and local build verification must wait until Node is installed.

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
  - Static file inspection only.
  - Full `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build` were not run because Node/npm are not available in this shell.
- Open issues:
  - Supabase project values still need to be added to `.env.local`.
  - The initial migration still needs to be applied in Supabase.
  - First local build should be run after Node is installed.
