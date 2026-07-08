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

## 2026-07-03 - Release 1 Setup Continuation

- Task: Continue Release 1 setup from `NEXT_STEPS.md`.
- Files changed:
  - Created ignored local environment file `.env.local` from the available Supabase values.
  - Restored `.env.example` to placeholder values so secrets are not kept in the template file.
- Environment:
  - Derived the Supabase project URL from the configured anon key project ref.
  - Node.js is installed through WinGet, but its install directory is not currently on the shell PATH.
- Tests run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Result:
  - Typecheck, lint, and production build passed locally.
- Open issues:
  - The remote Supabase project is reachable, but `public.shops` is missing.
  - Apply `supabase/migrations/202607030001_initial_schema.sql` in Supabase before testing login, shop setup, imports, and quotes end-to-end.

## 2026-07-03 - Supabase Migration Applied

- Task: Apply the initial Release 1 database schema in Supabase.
- Result:
  - `supabase/migrations/202607030001_initial_schema.sql` was run successfully in the Supabase SQL Editor.
  - Verified the app can reach `public.shops` through the Supabase REST API.
- Current status:
  - Local dev server is running at `http://localhost:3000`.
  - Release 1 is ready for the login, shop profile, import, and quote testing flow.

## 2026-07-03 - Product Foundation Implementation

- Task: Implement the detailed product foundation plan for Shopify CSV and future PC Builder compatibility.
- Files changed:
  - Added migration `supabase/migrations/202607030002_product_foundation.sql` for product handles, comparison pricing, quick descriptions, builder flags, compatibility JSON, image arrays, and source metadata.
  - Added Shopify-aware CSV parsing that groups rows by handle, preserves product images, stores variants in source metadata, and maps Shopify metafields into `specs` and `compat`.
  - Added local CSV upload alongside published CSV URL imports.
  - Added product spec helpers, admin product compatibility chips, public product detail pages, and richer price-list rows.
- Tests run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Open issue:
  - Apply `supabase/migrations/202607030002_product_foundation.sql` in Supabase before testing Shopify CSV upload.

## 2026-07-04 - Product Editor And Compatibility Cleanup Tools

- Task: Keep quote-flow testing and product-audit review as pending to-dos, then implement the admin product editor.
- Files changed:
  - Added shared editor field definitions in `src/lib/product-editor-fields.ts`.
  - Added `getProductById` data access for shop-scoped product editing.
  - Added `updateProduct` server action for pricing, visibility, descriptions, availability, and specs/compat JSON updates.
  - Added `/app/products/[id]` admin product editor route.
  - Added Edit Product links from the admin products table.
  - Added editor layout styles.
- Tests run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Current to-do:
  - Test public quote flow end to end.
  - Review the Product Audit and use the editor to fix missing compatibility/spec fields.

## 2026-07-04 - Seller Profile Listings And Product Conditions

- Task: Implement listings-first seller profiles and product condition support.
- Files changed:
  - Added migration `supabase/migrations/202607040001_seller_profile_and_conditions.sql` for seller About/review proof fields, product condition, and quote item condition snapshots.
  - Added shared product condition labels and normalization.
  - Updated CSV import, product editor, admin products table, public product details, quote submission, and quote inbox to support conditions.
  - Reworked `/shop/[slug]` into a listings-first seller profile with category-first browsing, search, brand filter, condition filter, sorting, About, and external review proof.
  - Updated `workflow.md` and `README.md` for the new workflow and optional `condition` import column.
- Tests run:
  - `npm.cmd run typecheck`
  - `npm.cmd exec eslint src`
  - `npm.cmd run build`
- Note:
  - `npm.cmd run lint` still fails on unrelated files under the untracked `Shopify App - Copy` folder.

## 2026-07-07 - Seller Listing Inventory And Availability

- Task: Implement the seller-side listings, inventory, availability, and quote inbox MVP.
- Files changed:
  - Added migration `supabase/migrations/202607070001_seller_listing_inventory.sql` for listing inventory quantity, availability status, public quantity toggle, and quote availability snapshots.
  - Added shared product availability helpers for labels, normalization, public summaries, lead-time requirements, and quote eligibility.
  - Added manual listing creation at `/app/products/new` and renamed the admin product area to My Listings.
  - Updated product editing, CSV import, public seller listings, product details, and public quote forms for on-hand, pre-order, and sold-out states.
  - Improved `/app/quotes` with status filters, clearer contact handoff, and availability/lead-time quote item snapshots.
- Tests run:
  - `npm.cmd run typecheck`
  - `npm.cmd exec eslint src`
  - `npm.cmd run build`
- Open issue:
  - Apply all Supabase migrations through `202607070001_seller_listing_inventory.sql` before testing the new listing availability fields against the live database.

## 2026-07-07 - Guided Catalog Add Listing

- Task: Rework Add Listing around component-first catalog selection and seller-specific listing details.
- Files changed:
  - Added migration `supabase/migrations/202607070002_product_catalog_items.sql` for global canonical product catalog items and product `catalog_item_id` links.
  - Added catalog data access and import-time catalog upsert so Shopify/CSV imports seed canonical items from specs and compatibility metadata.
  - Reworked `/app/products/new` into a guided flow: category, catalog search/brand filter, selected catalog item, then seller price/condition/inventory/availability.
  - Hid seller-facing handle editing, removed quick description from listing forms, and kept SKU separate from model/part number.
  - Replaced all-in-one technical editor groups with category-specific fields based on `Components_metaobjects.md`.
- Tests run:
  - `npm.cmd run typecheck`
  - `npm.cmd exec eslint src`
  - `npm.cmd run build`
- Open issue:
  - Apply Supabase migration `202607070002_product_catalog_items.sql`, then import or re-import Shopify/CSV products to seed catalog search results.
