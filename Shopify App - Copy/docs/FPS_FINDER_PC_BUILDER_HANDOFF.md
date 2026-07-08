# FPS Finder -> PC Builder Handoff
Last updated: 2026-04-14 16:16

## Purpose
- This file documents the current live handoff between FPS Finder and PC Builder.
- Keep this as the first place to check before changing how recommendation clicks open PC Builder.
- The current goal is minimal and stable: clicking a builder link from FPS Finder should prefill CPU and GPU only.

## Current live behavior
- FPS Finder recommendation cards open PC Builder with CPU and GPU variant IDs in the URL.
- Current URL shape:
  - `builder_page_url?cpu=<variantId>&gpu=<variantId>&src=fps_finder`
- If the FPS Finder section's `PC Builder page URL` setting is blank, the runtime now falls back to:
  - `/pages/pc-builder-2`
- PC Builder reads those URL params on load and applies the matching CPU and GPU selections.
- When the handoff URL includes `src=fps_finder` and at least one part is restored, PC Builder logs a one-time `fps_finder` event through the existing PC Builder logger.
- No quote routing, draft restore, approval restore, or full-build resume is part of this handoff.

## Ownership split
- FPS Finder owns the outgoing link creation:
  - `FPS Finder/assets/ucp-fps-finder.js`
- PC Builder owns URL-param parsing and selection restore:
  - `PC Builder 2/assets/ucp-pcb-build-link.js`
  - `PC Builder 2/assets/ucp-pc-builder.js`

## Current data flow
1. FPS Finder resolves a mapped CPU product and GPU product for a recommendation card.
2. FPS Finder builds the PC Builder URL with:
   - `cpu=<cpuVariantId>`
   - `gpu=<gpuVariantId>`
   - `src=fps_finder`
3. Shopper clicks the CTA.
4. PC Builder loads.
5. `ucp-pcb-build-link.js` reads URL params and calls the exposed builder API.
6. `ucp-pc-builder.js` resolves the variant IDs, selects the matching CPU and GPU, applies dependencies, and re-renders the picked summary.
7. If the entry source is `fps_finder`, PC Builder logs the `fps_finder` event.

## Important file-level notes
- `FPS Finder/assets/ucp-fps-finder.js`
  - `buildBuilderUrl(...)` is the handoff function.
  - It currently stays stateless on purpose.
  - It prefers the configured `builder_page_url`, then falls back to `/pages/pc-builder-2` when that setting is blank.
  - It marks FPS Finder entries with `src=fps_finder`.
- `PC Builder 2/assets/ucp-pcb-build-link.js`
  - `applyBuildFromUrl(...)` parses URL params and applies selected part IDs in dependency-friendly order.
  - It skips this path when a full `build=` payload is already present.
  - It logs `fps_finder` when a marked FPS Finder entry successfully restores at least one part.
- `PC Builder 2/assets/ucp-pc-builder.js`
  - `window.UCP_PCB_API.selectVariantById(...)` is the selection entry point used by the build-link adapter.
  - This function is what actually finds the live product + variant and adds it to the picked state.

## What this handoff intentionally does not do
- It does not save the shopper's in-progress PC Builder draft.
- It does not restore RAM, SSD, motherboard, cooler, PSU, case, case fans, or other items from FPS Finder clicks.
- It does not create quote codes.
- It does not trigger approval flow.
- It does not use the full `build=` payload path.

## Safe future extension
- If a future phase needs full-build resume between FPS Finder and PC Builder, prefer reusing the existing PC Builder `build=` payload format instead of inventing a second restore format.
- The current builder already exposes the right primitives for that path:
  - share payload creation in `ucp-pc-builder.js`
  - `build=` URL application in `ucp-pcb-build-link.js`
  - full payload application through `window.UCP_PCB_API.applyBuildPayload(...)`
- Do not replace the simple `cpu` + `gpu` handoff unless the new requirement truly needs full-build restore.

## Regression checklist
- Clicking a top FPS Finder recommendation opens PC Builder with CPU and GPU selected.
- Clicking a tier card opens PC Builder with CPU and GPU selected.
- Clicking a compare-card CTA opens PC Builder with CPU and GPU selected.
- The PC Builder URL contains `cpu` and `gpu` params after the click.
- No unrelated PC Builder behavior changes:
  - quote
  - approval
  - share
  - add to cart
  - screenshot

## Decision log for this phase
- Keep the handoff minimal.
- Keep PC Builder behavior unchanged.
- Document the integration clearly before adding any resume or save behavior later.
