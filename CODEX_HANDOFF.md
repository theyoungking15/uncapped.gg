# Codex Handoff

This repo is the active Uncapped.gg standalone website project.

## Current Project

- Path: `C:\Users\Prince\Desktop\Apps\uncapped.gg`
- App type: Next.js + Supabase
- Git remote: `https://github.com/theyoungking15/uncapped.gg.git`
- Main local command: `npm run dev`
- Local URL: `http://localhost:3000`

The project is separate from the Shopify workspace. The copied Shopify folder is included in this repo only because the owner wants the current working context available from another laptop.

## Current Goal

Build Release 1 of Uncapped.gg as a multi-shop PC sales system for Philippine PC sellers.

Release 1 focuses on:

- Seller login by Supabase magic link
- Seller shop profile setup
- Manual seller listings
- Product import from Google Sheets published CSV or Shopify CSV export
- Seller inventory quantity and availability status
- Product conditions such as brand new, open box, used, and as-is
- Public seller profile pages
- Public price list pages
- Public product detail pages
- Customer quote request flow
- Seller quote inbox and status management
- Facebook Page, Messenger, Marketplace, and review proof links

Later phases are planned for PC Builder, compatibility rules, saved/shareable builds, bundles, FPS Finder, maps/delivery, and deeper Shopify integration.

## Recent Work

The current local changes add the seller-listing foundation:

- Expanded product schema migrations for product fundamentals, conditions, seller profile fields, listing inventory, and global product catalog items.
- Added manual listing creation and listing editing pages under `/app/products`.
- Added public product detail routes under `/shop/[slug]/products/[handle]`.
- Changed admin product language toward "listings" instead of only imported products.
- Added availability fields: `on_hand`, `pre_order`, and `sold_out`.
- Added seller-managed inventory quantity and public quantity toggle.
- Added product conditions and quote item snapshots for condition and availability.
- Added product specs and compatibility JSON foundations for future PC Builder.
- Added a PC Builder data audit in the products admin page.
- Added Shopify CSV import support in addition to generic published CSV import.
- Added listings-first public seller profile UI.
- Added quote inbox filtering and contact links.

Important reference docs:

- `README.md`: setup and import basics
- `NEXT_STEPS.md`: setup handoff and manual testing flow
- `workflow.md`: current app workflow and data model
- `uncappedgg.md`: implementation log
- `Components_metaobjects.md`: product/component metadata reference

## Supabase Setup

The app expects `.env.local`, but that file is intentionally ignored by Git because it contains secrets.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run Supabase SQL migrations in order from `supabase/migrations`:

1. `202607030001_initial_schema.sql`
2. `202607030002_product_foundation.sql`
3. `202607040001_seller_profile_and_conditions.sql`
4. `202607070001_seller_listing_inventory.sql`
5. `202607070002_product_catalog_items.sql`

If quote submission or product editing fails with missing column errors, the likely cause is that the latest migrations were not applied to the Supabase project.

## How To Run

From PowerShell:

```powershell
cd "C:\Users\Prince\Desktop\Apps\uncapped.gg"
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful checks:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Main Test Flow

1. Open `/login`.
2. Sign in with a Supabase email magic link.
3. Go to `/app/settings` and create or confirm a seller profile.
4. Add a listing at `/app/products/new`.
5. Edit listings from `/app/products`.
6. Import products from `/app/imports`.
7. Open the public seller page at `/shop/[your-slug]`.
8. Open the price list at `/shop/[your-slug]/pricelist`.
9. Open a product detail page at `/shop/[your-slug]/products/[handle]`.
10. Submit a quote request.
11. Review and update quote status at `/app/quotes`.

## Notes For The Next Codex

- Respect the existing Next.js App Router structure in `src/app`.
- Server actions live in `src/server/actions.ts`.
- Data helpers live in `src/lib/data.ts`.
- Product condition, availability, PC Builder contract, editor field, and foundation helpers are separated under `src/lib`.
- Avoid committing `.env.local` or service role values.
- The owner wants the repo pushed so another laptop can pull the full working context.
- If adding more product fundamentals, align with `Components_metaobjects.md` and the future PC Builder compatibility model.
