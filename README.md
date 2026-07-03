# Uncapped.gg

Uncapped.gg is a multi-shop PC sales system for computer shops.

Release 1 focuses on:

- shop profile pages
- admin dashboard
- Google Sheets published CSV import
- public price lists
- quote request forms
- quote inbox for shop owners
- Facebook Page and Messenger links

Later phases will add PC Builder, compatibility rules, shop branding, shareable build links, bundle/promo logic, FPS Finder, and delivery/map APIs.

## Setup

1. Install Node.js.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in Supabase values.
4. Run the Supabase migration in `supabase/migrations`.
5. Start the app:

```bash
npm run dev
```

## Google Sheets Import

Release 1 uses a published CSV URL. In Google Sheets, publish the sheet as CSV, then paste that URL in `/app/imports`.

Required columns:

- `title`
- `category`
- `price`

Optional columns:

- `brand`
- `sku`
- `model`
- `stock_status`
- `image_url`
- `product_url`
- `description`
- `socket`
- `chipset`
- `gpu_chipset`
- `memory_type`
- `watts`
- `form_factor`

## Project Log

All project implementation notes are tracked in `uncappedgg.md`.
