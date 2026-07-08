# Uncapped.gg Workflow

Current website workflow for the standalone Next.js + Supabase app.

This document maps the active app in `src/app`, the server actions in `src/server/actions.ts`, and the Supabase tables in `supabase/migrations`.

## Release 1 Scope

Release 1 is a multi-shop PC sales workflow:

- shop owner login by Supabase email magic link
- shop profile setup
- product import from a published CSV URL or uploaded Shopify CSV export
- product condition tracking for brand new, open box, used, and as-is items
- manual seller listing creation
- global product catalog linking for canonical product specs
- seller-managed inventory quantity and availability status
- product review and editing
- listings-first public seller profile
- public price list with filters
- public quote request form
- owner quote inbox and status tracking

Later phases are planned for PC Builder, stronger compatibility rules, shareable builds, bundles/promos, FPS Finder, branding, delivery/maps, and deeper Shopify integration.

## Owner Setup Flow

```mermaid
flowchart TD
  visitor["Shop owner visits /"] --> landing["Landing page"]
  landing --> login["/login"]
  login --> signin["LoginForm"]
  signin --> magic["signInWithEmail sends Supabase magic link"]
  magic --> callback["/auth/callback exchanges code for session"]
  callback --> appGate["/app layout checks Supabase env and user session"]

  appGate --> envMissing{"Supabase env configured?"}
  envMissing -- "No" --> envNotice["EnvNotice"]
  envMissing -- "Yes" --> authCheck{"Signed in?"}
  authCheck -- "No" --> login
  authCheck -- "Yes" --> shopCheck{"Current user has shop membership?"}

  shopCheck -- "No" --> emptyShop["EmptyShopNotice"]
  emptyShop --> settings["/app/settings"]
  settings --> profileForm["ShopProfileForm"]
  profileForm --> saveShop["saveShopProfile"]
  saveShop --> shopTables["shops + shop_members"]
  shopTables --> dashboard["/app dashboard"]

  shopCheck -- "Yes" --> adminShell["AdminShell"]
  adminShell --> dashboard
  adminShell --> products["/app/products"]
  adminShell --> imports["/app/imports"]
  adminShell --> quotes["/app/quotes"]
  adminShell --> settings
  adminShell --> publicShop["/shop/[slug]"]
```

## Admin Product Flow

```mermaid
flowchart TD
  dashboard["/app dashboard"] --> imports["/app/imports"]
  dashboard --> newListing["/app/products/new"]
  newListing --> category["Choose component category"]
  category --> catalogSearch["Search/filter catalog item"]
  catalogSearch --> createProduct["createProduct"]
  createProduct --> manualInsert["Insert products row linked to catalog item when selected"]
  manualInsert --> products["/app/products"]
  imports --> importForm["ImportProductsForm"]
  importForm --> sourceChoice{"CSV source"}
  sourceChoice -- "Published CSV URL" --> fetchCsv["Fetch source_url"]
  sourceChoice -- "Uploaded CSV file" --> readUpload["Read csv_file"]

  fetchCsv --> parseCsv["parseProductCsv"]
  readUpload --> parseCsv
  parseCsv --> sourceType{"Detected source type"}
  sourceType -- "Generic CSV" --> genericMap["Normalize title, category, price, specs, compat"]
  sourceType -- "Shopify CSV" --> shopifyMap["Group by handle, map images, variants, metafields, specs, compat"]

  genericMap --> genericMatch["Find existing product by SKU, then handle"]
  shopifyMap --> shopifyMatch["Find existing product by handle"]
  genericMatch --> productsTable["Insert or update products"]
  shopifyMatch --> productsTable
  productsTable --> importLog["Write product_imports log"]
  importLog --> revalidate["Revalidate admin and public product paths"]

  revalidate --> products["/app/products"]
  products --> audit["PC Builder data audit"]
  products --> productEdit["/app/products/[id]"]
  productEdit --> editForm["ProductEditForm"]
  editForm --> condition["Set product condition"]
  condition --> availability["Set availability, inventory, and lead time"]
  availability --> updateProduct["updateProduct"]
  updateProduct --> productsTable
  productEdit --> publicProduct["/shop/[slug]/products/[handle]"]
```

## Public Customer Flow

```mermaid
flowchart TD
  customer["Customer"] --> shopPage["/shop/[slug] seller profile"]
  shopPage --> listings["Browse seller listings"]
  listings --> listingFilters["Category, search, brand, condition, and sort controls"]
  listingFilters --> priceList["/shop/[slug]/pricelist"]
  shopPage --> messenger["Messenger link"]
  shopPage --> facebook["Facebook Page link"]
  shopPage --> reviews["External Facebook Marketplace/review proof"]

  priceList --> activeProducts["Load active products only"]
  activeProducts --> quoteForm["QuoteRequestForm"]
  quoteForm --> browse["Browse tabs by PC category"]
  browse --> filters["Search, brand filter, category facets"]
  filters --> detail{"Needs product details?"}
  detail -- "Yes" --> productPage["/shop/[slug]/products/[handle]"]
  productPage --> priceList
  detail -- "No" --> quantities["Select item quantities"]

  quantities --> customerInfo["Enter name, contact method, contact detail, notes"]
  customerInfo --> submitQuote["submitPublicQuote"]
  submitQuote --> validate["Validate shop, contact info, and selected active products"]
  validate --> quoteTables["Create quote_requests + quote_items"]
  quoteTables --> quoteCode["Show quote code to customer"]
  quoteTables --> ownerInbox["Owner sees request in /app/quotes"]
```

## Quote Management Flow

```mermaid
flowchart LR
  quoteNew["new"] --> quoteReviewing["reviewing"]
  quoteReviewing --> quoteQuoted["quoted"]
  quoteQuoted --> quoteClosed["closed"]

  inbox["/app/quotes"] --> quoteItems["Quote item snapshots"]
  inbox --> statusForm["Status select"]
  statusForm --> updateStatus["updateQuoteStatus"]
  updateStatus --> quoteNew
  updateStatus --> quoteReviewing
  updateStatus --> quoteQuoted
  updateStatus --> quoteClosed
```

## Data Model

```mermaid
erDiagram
  shops ||--o{ shop_members : has
  shops ||--o{ products : owns
  shops ||--o{ product_imports : logs
  shops ||--o{ quote_requests : receives
  quote_requests ||--o{ quote_items : contains
  products ||--o{ quote_items : snapshot_source
  product_catalog_items ||--o{ products : canonical_source

  shops {
    uuid id
    text slug
    text name
    text tagline
    text about
    text facebook_page_url
    text facebook_marketplace_url
    text external_review_url
    numeric external_rating
    integer external_review_count
    text messenger_url
    text phone
    text address
    text logo_url
  }

  shop_members {
    uuid shop_id
    uuid user_id
    text role
  }

  products {
    uuid id
    uuid shop_id
    uuid catalog_item_id
    text handle
    text title
    text category
    text condition
    integer inventory_quantity
    text availability_status
    boolean show_inventory_quantity
    numeric price
    numeric compare_at_price
    text brand
    text sku
    text stock_status
    jsonb specs
    jsonb compat
    jsonb image_urls
    jsonb source_metadata
    boolean pc_builder_enabled
    boolean is_active
  }

  product_catalog_items {
    uuid id
    text catalog_key
    text category
    text brand
    text canonical_name
    text model
    text part_number
    jsonb search_aliases
    jsonb specs
    jsonb compat
  }

  product_imports {
    uuid id
    uuid shop_id
    text source_type
    text source_url
    text status
    integer total_rows
    integer imported_rows
    integer error_rows
    jsonb error_report
  }

  quote_requests {
    uuid id
    uuid shop_id
    text quote_code
    text customer_name
    text contact_method
    text contact_value
    text status
    numeric subtotal
  }

  quote_items {
    uuid id
    uuid quote_id
    uuid product_id
    text title_snapshot
    text category_snapshot
    text condition_snapshot
    text availability_status_snapshot
    text lead_time_label_snapshot
    integer quantity
    numeric unit_price_snapshot
    numeric line_total
  }
```

## Current Route Map

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Public / owner | Marketing entry point with link to owner login. |
| `/login` | Owner | Sends Supabase email magic link. |
| `/auth/callback` | Owner auth | Exchanges Supabase auth code and redirects to `/app`. |
| `/app` | Owner | Protected dashboard with active products, quote count, and quoted value. |
| `/app/settings` | Owner | Create or update seller profile, contact links, about text, and external review proof. |
| `/app/imports` | Owner | Import products from published CSV URL or uploaded CSV file; shows import history. |
| `/app/products` | Owner | My Listings view with inventory, availability, condition, public links, builder readiness audit, and edit links. |
| `/app/products/new` | Owner | Guided Add Listing: choose category, search catalog, then enter seller price, condition, inventory, and availability. |
| `/app/products/[id]` | Owner | Listing editor for basics, condition, availability, visibility, pricing, and category-specific specs. |
| `/app/quotes` | Owner | Quote inbox with line items and status updates. |
| `/shop/[slug]` | Customer | Listings-first seller profile with filters, About, external review proof, Messenger, and Facebook links. |
| `/shop/[slug]/pricelist` | Customer | Active product list, category tabs, condition/brand/search filters, sorting, quantities, and quote request form. |
| `/shop/[slug]/products/[handle]` | Customer | Public product detail page for active products with handles and condition. |

## Product Categories

The product workflow uses PC Builder-compatible category keys:

- `processor` - CPU
- `motherboard` - Motherboard
- `memory` - RAM
- `gpu` - GPU
- `ssd` - SSD
- `cpucooler` - CPU Cooler
- `powersupply` - Power Supply
- `case` - Case
- `casefans` - Case Fans
- `other` - Other

These categories drive admin grouping, the public price list tabs, product facets, and the current builder audit.

## Important Behavior Notes

- Public shop pages read by `slug`; missing shops return `notFound`.
- Public product and price list pages only show products where `is_active` is true.
- Sold-out listings remain visible but cannot be selected in public quote forms.
- Pre-order listings are quoteable and require a fulfillment lead-time label.
- Inventory quantity is seller-managed and is not automatically decremented by quote requests.
- Exact inventory is only public when `show_inventory_quantity` is enabled for that listing.
- Seller listings can link to a global `product_catalog_items` row so canonical specs are inherited from the catalog.
- Catalog-linked listings keep seller-specific title, condition, price, inventory, and availability separate from canonical specs.
- Product handles are generated internally for public URLs and are not part of the normal seller listing form.
- Admin routes under `/app` require Supabase env values and an authenticated user.
- `getCurrentShop` currently uses the first shop membership for the signed-in user.
- Product imports update existing rows by SKU or handle. Shopify CSV imports prefer handle matching.
- Blank or unknown import conditions preserve an existing product condition; new products default to `brand_new`.
- Quote items store title, category, condition, unit price, and line total snapshots so old quotes remain readable if product data changes later.
- Quote items also snapshot availability status and fulfillment lead time.
- Quote statuses currently support `new`, `reviewing`, `quoted`, and `closed`.

## Current To-Do

- Test public quote submission end to end.
- Use the `/app/products` audit and `/app/products/[id]` editor to fill missing compatibility/spec fields.
- Apply all Supabase migrations through `supabase/migrations/202607070002_product_catalog_items.sql` before relying on catalog-linked Add Listing.
