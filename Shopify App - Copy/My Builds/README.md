# My Builds Foundation

## What This Folder Is For

This folder is the dedicated workspace-level home for the `My Builds` feature.

It exists so the feature has a clear place in the repo before runtime code is added across the existing app and theme surfaces.

For now, this folder is documentation-first.

Later, this folder can also hold:
- feature notes
- test checklists
- implementation plans
- migration notes

## Which Shopify App My Builds Will Use

`My Builds` will use the **existing custom app** in:

- [Upgrade Assist/app](D:/Prince/Shopify%20App/Upgrade%20Assist/app)

This is the app currently connected to Shopify and already used for:
- app proxy routing
- local backend logic
- Shopify Admin API access
- metaobject writes
- customer-account extension deployment

We are **not** creating a second Shopify app for `My Builds`.

Reason:
- one installed app already exists
- that app already has the required backend and proxy foundation
- Shopify only allows one app proxy root per app, so reusing the current app is the clean path

## Current Relevant App Config

The current Shopify app config is in:

- [shopify.app.toml](D:/Prince/Shopify%20App/Upgrade%20Assist/app/shopify.app.toml)

Relevant current scopes:
- `write_app_proxy`
- `read_metaobjects`
- `write_metaobjects`
- `read_products`
- `read_files`
- `write_files`

Current proxy config:
- prefix: `apps`
- subpath: `upgrade-assist`

So `My Builds` should reuse this proxy root and add child routes under it, for example:
- `/apps/upgrade-assist/my-builds/save`
- `/apps/upgrade-assist/my-builds/list`
- `/apps/upgrade-assist/my-builds/delete`
- `/apps/upgrade-assist/my-builds/share/...`

## How My Builds Connects To The Customer Account

The real ownership key is the **Shopify customer ID**.

That means:
- each saved build belongs to one Shopify customer account
- username is not the ownership key
- email is not the ownership key
- handle is not the ownership key

The connection works through the app proxy request:

1. a logged-in customer uses the storefront PC Builder
2. the storefront calls the app proxy
3. Shopify forwards the request to the backend app
4. Shopify includes `logged_in_customer_id` on the proxied request
5. the backend verifies the proxy request and uses that customer ID as the owner

This is the foundation for:
- saving builds
- listing only the customer's own builds
- reopening builds
- deleting builds
- enforcing ownership on every write action

## How My Builds Connects To PC Builder

The PC Builder already has working builder-state behavior in:

- [PC Builder 2/assets/ucp-pc-builder.js](D:/Prince/Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.js)
- [PC Builder 2/assets/ucp-pcb-build-link.js](D:/Prince/Shopify%20App/PC%20Builder%202/assets/ucp-pcb-build-link.js)
- [PC Builder 2/sections/ucp-pc-builder.liquid](D:/Prince/Shopify%20App/PC%20Builder%202/sections/ucp-pc-builder.liquid)

The builder already supports:
- selected-part snapshots
- shareable build URLs
- quote/build context
- reopening builds from URL parameters and encoded payloads

`My Builds` should reuse that existing builder-state pattern instead of inventing a second build format.

Planned connection:

1. customer builds a PC in the existing PC Builder
2. customer clicks `Save Build`
3. current builder state is serialized from the existing builder snapshot/share payload logic
4. that payload is sent to the backend app through the app proxy
5. backend saves the build record to Shopify
6. later, `Open` on a saved build restores that payload back into the builder

## How Saved Builds Will Be Stored

The Shopify-side storage foundation is the `saved_build` metaobject definition that has already been created manually in Shopify Admin.

Each saved build record should store at minimum:
- internal saved build ID
- `owner_customer_id`
- `owner_customer_email_snapshot`
- `owner_customer_name_snapshot`
- `build_name`
- `build_payload`
- `build_snapshot`
- `quote_code` when available
- `status`
- `visibility`
- `created_at`
- `updated_at`

This supports:
- multiple saved builds per customer
- clean ownership enforcement
- direct My Builds component display without opening PC Builder first
- saved-build screenshot generation from the My Builds page
- future quote linkage
- future account history
- future share attribution without changing ownership rules

`build_payload` remains the compact restore payload used to reopen PC Builder. `build_snapshot` is optional display data used for My Builds detail rows, screenshots, and future public/Discord sharing. Shopify product pages and checkout remain the source of truth for live price and availability.

## Planned MVP Behavior

Initial `My Builds` MVP should support:
- `Save Build` from PC Builder
- `My Builds` page for logged-in customers
- `Open` a saved build in PC Builder
- `Share` a saved build
- `Rename` a saved build
- `Archive` and `Unarchive` a saved build
- `Delete` a saved build

Possible later additions:
- duplicate build
- public profile attribution
- quote history linkage
- upgrade recommendations tied to saved builds

## Important Architectural Decision

`My Builds` should start as a **storefront page backed by the existing app proxy**, not a customer-account UI extension.

Reason:
- it avoids the current customer-account editor / plan blocker
- it still uses real Shopify customer identity
- it stays compatible with moving into customer accounts later

## Expected Runtime Surfaces

When implementation starts, code will likely touch:

- backend app routes and logic:
  - [Upgrade Assist/app/src/server.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/server.js)
  - new supporting library files under `Upgrade Assist/app/src/lib/`

- Shopify persistence helpers:
  - likely extend or parallel the existing Shopify admin helper patterns already used in `Upgrade Assist/app/src/lib/`

- PC Builder storefront:
  - [PC Builder 2/assets/ucp-pc-builder.js](D:/Prince/Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.js)
  - [PC Builder 2/sections/ucp-pc-builder.liquid](D:/Prince%20Shopify%20App/PC%20Builder%202/sections/ucp-pc-builder.liquid)

- `My Builds` storefront page/template:
  - likely a new section/template under a dedicated `My Builds` page implementation

## What Has Already Been Prepared

Already ready:
- `saved_build` metaobject definition in Shopify
- customer metafield foundation
- installed Shopify custom app
- app proxy scope
- metaobject read/write scopes
- Shopify CLI setup

Not implemented yet:
- dedicated public share page behavior
- saved-build overwrite or duplicate flows

## Short Answer To The Scope Question

If someone asks "which app is `My Builds` using?", the answer is:

`My Builds` will use the existing installed custom app in [Upgrade Assist/app](D:/Prince/Shopify%20App/Upgrade%20Assist/app), because that app already owns the proxy, Shopify API access, and backend foundation needed to save and query customer-owned build records.

## Current Implemented Phase

The current phase is:

- real saved-build list route
- real saved-build create route
- real saved-build rename / archive / unarchive / share / delete routes
- two-column `My Builds` page with selected build details
- additive `Save Build` action in the existing PC Builder
- rich `build_snapshot` storage for newly saved builds
- My Builds screenshot generation from saved snapshot data
- `UCP PC Builder Logs` save-build event logging with Shopify customer identity when logged in

Implemented files:

- backend app:
  - [Upgrade Assist/app/src/server.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/server.js)
  - [Upgrade Assist/app/src/lib/shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js)
  - [Upgrade Assist/app/src/config.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/config.js)
  - [Upgrade Assist/app/.env.example](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/.env.example)
  - [Apps Script/PC Builder Data/PC Builder Data Saver](D:/Prince%20Shopify%20App/Apps%20Script/PC%20Builder%20Data/PC%20Builder%20Data%20Saver)

- storefront page:
  - [My Builds/sections/my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid)
  - [My Builds/templates/page.my-builds.json](D:/Prince%20Shopify%20App/My%20Builds/templates/page.my-builds.json)

- PC Builder integration:
  - [PC Builder 2/sections/ucp-pc-builder.liquid](D:/Prince%20Shopify%20App/PC%20Builder%202/sections/ucp-pc-builder.liquid)
  - [PC Builder 2/assets/ucp-pc-builder.js](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.js)
  - [PC Builder 2/assets/ucp-pc-builder.css](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.css)

What this phase does:

- uses the existing app proxy to request `/my-builds/list`
- uses the existing app proxy to post `/my-builds/save`
- uses the existing app proxy to post `/my-builds/:handle/rename`, `/archive`, `/unarchive`, `/share`, and `/delete`
- verifies the logged-in customer through Shopify's proxied `logged_in_customer_id`
- queries `saved_build` records from Shopify
- creates new `saved_build` records from the existing builder share payload plus optional rich snapshot data
- filters them to the current owner customer ID
- renders the `My Builds` page with real runtime states
- adds `Save Build` to the current builder action surfaces without changing share, quote, or add-to-cart behavior
- adds `Open build` on each `My Builds` card by preferring the short builder `?quote=` restore URL when a quote code exists, with fallback to the saved `build=` payload only when needed
- renders a left-side saved-build list and a right-side selected build detail panel
- shows component image, component label, product title, variant, quantity, price, and product link when those fields exist in `build_snapshot`
- supports `Share`, `Rename`, `Archive`, `Unarchive`, hard `Delete`, and `Screenshot` directly from the selected build detail panel
- uses the short builder `?quote=` URL for share links whenever a quote code exists, with fallback to the encoded `build=` payload only when no quote code is available
- writes `save_build_click`, `save_build_success`, `save_build_blocked`, and `save_build_failed` into the current `UCP PC Builder Logs`
- includes Shopify customer ID, email, and saved-build identifiers in those log rows when available

What this phase does not do yet:

- expose a dedicated public saved-build page
- support duplicate or overwrite flows
