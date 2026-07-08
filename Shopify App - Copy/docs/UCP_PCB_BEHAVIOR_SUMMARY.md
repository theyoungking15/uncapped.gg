# UCP PC Builder - Current Behavior Summary
Last updated: 2026-01-26

## Purpose
- This file summarizes the current PC Builder behavior for planning new features.
- For full constraints and stable IDs, see `UCP_CODEX_CONTEXT.md.txt`.

## Where the builder lives
- Section scaffold: `sections/ucp-pc-builder.liquid`
- Core logic: `assets/ucp-pc-builder.js`
- Supporting modules: `assets/ucp-pcb-build-link.js`, `assets/ucp-pcb-request-quote.js`, `assets/ucp-pcb-approval.js`, `assets/ucp-pcb-quote-lookup.js`, `assets/ucp-pcb-quote-image.js`, `assets/ucp-pcb-onboarding.js`
- Styles: `assets/ucp-pc-builder.css`

## Boot and data flow
- Section renders the DOM and embeds `#ucp-pcb-config` and `#ucp-pcb-bundle-rules` JSON.
- Scripts load in order: `ucp-pc-builder.js`, `ucp-pcb-build-link.js`, `ucp-pcb-request-quote.js`, then onboarding, quote lookup, and approval.
- On load, JS reads config and fetches bundle rules from `/pages/ucp-pcb-bundle-rules?view=ucp-pcb-bundle-rules-json`.
- Bundle rules are fetched across pages and replace the fallback JSON.
- Product data loads per category from collection JSON views using `?view=ucp-pc-builder-json`.
- Product JSON includes variants, pricing, specs, and compatibility fields.

## Layout and UX
- Desktop uses a table layout with tabbed categories and a sticky tab row.
- Mobile uses card layouts plus a sticky action bar and a summary drawer.
- Summary panel shows picked parts, subtotal, and bundle savings.

## Filters and compatibility
- Filters include brand, socket, chipset, GPU brand, board partner, form factor, watts, cooler type, case form factor, and price range.
- Compatibility rules use product `compat` fields to filter or flag items.
- Multi-pick categories (case fans, other) support quantities.

## Selection and pricing
- Selecting a variant updates the picked list and summary totals.
- Price display can show compare price, effective price, and bundle savings notes.
- Add to Cart posts selected variants and quantities.

## Performance preview (optional)
- Performance Preview card is controlled by a section setting.
- It expects benchmark metaobject data when configured; current config leaves the endpoint and token blank.

## Share build link
- Share generates a URL with selected variant IDs.
- Build links can restore selections on page load.
- Quote metadata can be appended (`quote` and `quoteVersion`), and approvals use `approved=1`.
- Public API: `window.UCP_PCB_API.getSnapshot()`, `window.UCP_PCB_API.selectVariantById()`, `window.UCP_PCB_API.applyBuildPayload()`.

## Quote flow
- Request Quote opens a modal and generates or reuses a quote code.
- Quote version increments when the build changes to keep versions consistent.
- The modal supports copy of quote code and a reference build link.
- Messenger CTA uses the configured Messenger URL.

## Quote lookup and approval flow
- Quote lookup loads saved payloads before approval opens.
- Approval links restore the build and open the approval modal when `approved=1` is present.
- Approval flow includes a payment checklist, optional QR payment UI, and a reopen button when enabled.

## Screenshot export and PDF
- Create Screenshot uses html2canvas to export a quote image.
- The approval flow can generate a PDF with payment details.

## Logging (Google Apps Script)
- Logged events include add_to_cart, share, request_quote, approval actions, screenshot export, and PDF generation.
- Logged payloads include build link, approval link, quote code/version, and picked items (including multi-pick quantities).

## Onboarding and hints (optional)
- Onboarding modal has configurable title, bullets, and optional GIF or demo link.
- Micro-hints appear under the Share and Request Quote buttons.

## Important constraints to keep in mind
- Do not rename stable DOM IDs or data attributes.
- Do not break selection logic, compatibility filters, pricing, share link, or quote flows.
- See `UCP_CODEX_CONTEXT.md.txt` for the full constraints list.
