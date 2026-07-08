# UCP PCB Changelog

### 2026-01-26. Approval Links Carry off
**Goal**
- Preserve `off` in approval links when present on the current URL.

**Files changed**
- `PC Builder 2/assets/ucp-pc-builder.js` . Carry `off` when building approval links.
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Carry `off` in approval links for screenshot logs.

**Key selectors or IDs impacted**
- None.

**Data / config changes**
- URL param: `off` carried into approval links when present.

**Risk notes**
- If an approval link already has `off`, it will not be overwritten.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Down Payment in PDF Totals
**Goal**
- Show down payment and balance lines in the PDF totals when `dp` is present.

**Files changed**
- `PC Builder 2/assets/ucp-pc-builder.js` . Added dp calculations and rows to the PDF totals block.

**Key selectors or IDs impacted**
- None.

**Data / config changes**
- None.

**Risk notes**
- If `dp` is missing, the PDF continues to show only the payable subtotal.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Down Payment Amount Formatting
**Goal**
- Ensure down payment and balance values render with currency formatting.
- Allow dp math to read totals from the DOM when a live totals API is unavailable.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-approval.js` . Added money formatting fallback and DOM total parsing for dp calculations.

**Key selectors or IDs impacted**
- `#ucp-pcb-subtotal`

**Data / config changes**
- None.

**Risk notes**
- If the subtotal text format changes drastically, numeric parsing may fail.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Down Payment Parameter (dp)
**Goal**
- Parse `dp` from the URL for down payment percentage.
- Carry `dp` into approval links.
- Show down payment and balance in approval/payment UI and use dp amount for QR text.

**Files changed**
- `PC Builder 2/assets/ucp-pc-builder.js` . Parse `dp` from URL and expose it for approval flows, carry `dp` in approval links.
- `PC Builder 2/assets/ucp-pcb-approval.js` . Compute dp amount and balance, update approval/payment modal totals and QR amount text.
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Preserve `dp` when building approval links for screenshot logs.

**Key selectors or IDs impacted**
- `#ucp-pcb-payment-modal`
- `#ucp-pcb-pay-modal`

**Data / config changes**
- URL param: `dp` (down payment percent, clamped 0-100).

**Risk notes**
- If totals are not ready when the modal opens, dp rows may be hidden until totals refresh.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Bundle Page Collection + Debug Title
**Goal**
- Default the bundle page motherboard collection to `bundle-motherboard`.
- Show the motherboard title in bundle debug lines.

**Files changed**
- `Bundle Page/Sections/ucp-bundle-page.liquid` . Updated collection fallback/default and added `mobo_title` in debug output.

**Key selectors or IDs impacted**
- None.

**Data / config changes**
- Section setting default: `bundle_motherboards_collection = bundle-motherboard`.

**Risk notes**
- If the new collection handle is missing, the fallback still uses `motherboards`.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Additional Discount Label + Screenshot
**Goal**
- Rename manual discount label to "Additional discount".
- Show the additional discount line in quote screenshots when `off` is present.

**Files changed**
- `PC Builder 2/sections/ucp-pc-builder.liquid` . Updated the manual discount label in the totals UI.
- `PC Builder 2/assets/ucp-pc-builder.js` . Updated the manual discount label in the PDF totals block.
- `PC Builder 2/assets/ucp-pcb-approval.js` . Updated the manual discount label in approval totals.
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Added additional discount line to the screenshot totals.

**Key selectors or IDs impacted**
- `#ucp-pcb-manual-off`
- `[data-ucp-pcb-manual-off-row]`
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- If `off` is missing or invalid, the additional discount line stays hidden in screenshots.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Manual Discount Visibility
**Goal**
- Hide the manual discount row unless `off` is present and non-zero.

**Files changed**
- `PC Builder 2/assets/ucp-pc-builder.js` . Hide manual discount row in totals and conditionally show it in PDF totals.
- `PC Builder 2/assets/ucp-pcb-approval.js` . Only render manual discount row when a manual discount is present.
- `PC Builder 2/sections/ucp-pc-builder.liquid` . Added manual discount row hook for conditional visibility.

**Key selectors or IDs impacted**
- `#ucp-pcb-manual-off`
- `[data-ucp-pcb-manual-off-row]`

**Data / config changes**
- None.

**Risk notes**
- If `off` is set but not numeric, the manual row will remain hidden.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-26. Payable Subtotal + Manual Off
**Goal**
- Treat promo savings as bundle discount and apply manual off to payable subtotal.
- Compute payment method totals from payable subtotal.

**Files changed**
- `PC Builder 2/assets/ucp-pc-builder.js` . Added manual off parsing, payable subtotal math, updated totals, snapshots, logs, and PDF totals.
- `PC Builder 2/assets/ucp-pcb-build-link.js` . Preserve `off` param in shared build links.
- `PC Builder 2/assets/ucp-pcb-approval.js` . Show manual discount and payable subtotal in approval totals.
- `PC Builder 2/sections/ucp-pc-builder.liquid` . Added raw/manual/payable total rows and updated bundle discount label.

**Key selectors or IDs impacted**
- `#ucp-pcb-subtotal-raw`
- `#ucp-pcb-manual-off`
- `#ucp-pcb-subtotal`

**Data / config changes**
- URL param: `off` (manual discount).

**Risk notes**
- Manual off is clamped to avoid negative totals; verify with large `off` values.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Bundle PL2 Mobile Inline Filters
**Goal**
- Keep bundle list dropdown filters inline on mobile to save vertical space.

**Files changed**
- `Bundle Page/Sections/ucp-product-list2.liquid` . Add filter group classes and update mobile filter layout rules.

**Key selectors or IDs impacted**
- `.upl-product-filters__group--select`

**Data / config changes**
- None.

**Risk notes**
- Very long labels may wrap within half-width dropdowns.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Bundle PL2 Dropdown Filters
**Goal**
- Replace brand and component filters with dropdowns in the bundle product list section.

**Files changed**
- `Bundle Page/Sections/ucp-product-list2.liquid` . Convert filter groups to selects, update filter logic, and add select styling.

**Key selectors or IDs impacted**
- `.upl-product-filters__select`

**Data / config changes**
- None.

**Risk notes**
- Defaults with multiple handles now resolve to the first matching option in a dropdown.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Bundle Hub Rule Pricing Expansion
**Goal**
- Use the paginated bundle-rules endpoint to compute bundle pricing for all hub entries beyond the metaobject cap.

**Files changed**
- `Bundle Page/Sections/ucp-bundle-hub.liquid` . Fetch bundle rules JSON, compute price ranges per CPU, and render updated cards.
- `Bundle Page/templates/page.ucp-bundle-hub-json.liquid` . Add CPU identifiers to hub entries for rule matching.
- `Price list/templates/page.ucp-pcb-bundle-rules-json.liquid` . Add price and discount cents fields for rule pricing.

**Key selectors or IDs impacted**
- `[data-ucp-hub-rules-json]`

**Data / config changes**
- New bundle rules JSON fields: `discount_cents`, `cpu_price_cents`, `mobo_price_cents`
- New hub JSON fields: `cpu_product_id`, `cpu_handle`

**Risk notes**
- Bundle pricing depends on the bundle rules endpoint returning prices.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Bundle Hub Data Uncap + UI Polish
**Goal**
- Load all bundle hub entries via JSON pagination to bypass the metaobject cap.
- Refine Bundle Hub card and control styling.

**Files changed**
- `Bundle Page/Sections/ucp-bundle-hub.liquid` . Add JSON fetch/render path, refine card markup, and polish styles.
- `Bundle Page/templates/page.ucp-bundle-hub-json.liquid` . New paginated JSON endpoint for bundle hub entries.

**Key selectors or IDs impacted**
- `[data-ucp-hub]`
- `.ucp-hub-card`

**Data / config changes**
- New JSON endpoint `?view=ucp-bundle-hub-json`

**Risk notes**
- Hub cards fall back to the first page of entries if the JSON endpoint fails.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Bundle Price Hint Auto Update
**Goal**
- Update bundle price hints without forcing a full page reload.

**Files changed**
- `price list/sections/ucp-product-list.liquid` . Add motherboard hint placeholders, data attributes, and hint styling for dynamic updates.
- `price list/assets/ucp-bundle-price-hint-autorefresh.js` . Replace reload logic with cart + bundle rule lookup and DOM updates.

**Key selectors or IDs impacted**
- `.js-ucp-bundle-price-hint`
- `.ucp-bundle-active`

**Data / config changes**
- `data-mobo-product-id`
- `data-mobo-variant-id`
- `data-base-price`

**Risk notes**
- Bundle hints will not update if the bundle rules endpoint is unavailable.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-23. Quote Screenshot Export
**Goal**
- Add a quote screenshot button that exports the current build as PNG without touching PDF flow.

**Files changed**
- `PC Builder 2/sections/ucp-pc-builder.liquid` . Replace the PDF button in the UI with a screenshot button and load quote-image assets.
- `PC Builder 2/assets/ucp-pc-builder.js` . Expose picked item details and totals in the snapshot for the screenshot exporter.
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Render an offscreen quote card and export PNG via html2canvas.
- `PC Builder 2/assets/html2canvas.min.js` . Vendored html2canvas library.
- `PC Builder 2/templates/collection.ucp-pc-builder-json.liquid` . Add quick description metafield to product JSON.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`
- `#ucp-pcb-pdf`

**Data / config changes**
- `quick_description` product field in `collection.ucp-pc-builder-json` output.
- `UCP_PCB_API.getSnapshot().items` and `UCP_PCB_API.getSnapshot().totals`.

**Risk notes**
- Screenshot images depend on CORS-enabled image URLs.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Screenshot Quote Version Normalized
**Goal**
- Force screenshot logs to use quote version >= 1 so quote lookup works without `v`.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Normalize quoteVersion to 1 when missing/0.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- Version 1 may overwrite prior quote v1 payloads for the same code.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Screenshot Approval Link Uses Quote Only
**Goal**
- Log approval links as `?quote=...&approved=1` while keeping full build links for screenshots.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Set approvalLink to a short quote-only URL with approved=1.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- Quote lookup must be available for approval restore.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Screenshot Links Use Full Build Params
**Goal**
- Keep full build links for screenshot exports so approval restores parts correctly.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Reverted screenshot logging to use full build links with params and approval=1.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- If generateBuildLink fails, logs fall back to current page URL.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Quote Screenshot Short Links
**Goal**
- Log short quote links for screenshot exports instead of full build param URLs.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Emit short `?quote=...` and `?quote=...&approved=1` links when logging screenshot exports.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- If quote code is missing, logging falls back to the long build link.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Quote Screenshot Social Icons Layout
**Goal**
- Remove the dark social bar and show only centered social logos.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Removed social bar background and icon borders to keep only centered logos.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- Social icons rely on Shopify CDN URLs.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Quote Screenshot Header + Social Icons
**Goal**
- Add a centered brand logo header with left-aligned quote code/date/time.
- Replace social placeholders with uploaded icon images and tighten footer layout.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Added logo header layout tweaks, social icon images, short divider line, and spacing adjustments.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- Social icon URLs must remain accessible on the Shopify CDN.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).

### 2026-01-24. Quote Screenshot Styling + Logging
**Goal**
- Add brand logo header, social footer, and spacing tweaks for the quote screenshot export.
- Log quote screenshot exports and remove onboarding modal logging events.

**Files changed**
- `PC Builder 2/assets/ucp-pcb-quote-image.js` . Added logo header, border/spacing controls, larger images, social footer, and logging for screenshot exports.
- `PC Builder 2/assets/ucp-pcb-onboarding.js` . Removed onboarding shown/dismissed logging.
- `features and changes.md` . Log the update.

**Key selectors or IDs impacted**
- `#ucp-pcb-quote-image`

**Data / config changes**
- None.

**Risk notes**
- Social icons are text-based placeholders; swap to SVGs if needed.

**QA performed**
- Desktop. Not run (needs Shopify theme testing).
- Mobile. Not run (needs Shopify theme testing).
