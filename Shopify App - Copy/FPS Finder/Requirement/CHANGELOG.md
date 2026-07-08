# Changelog
## FPS Finder / Uncapped PC Shopify Theme

All meaningful implementation changes must be logged here.

---

## Entry format

### YYYY-MM-DD - Short title

**Area**
- FPS Finder
- PC Builder handoff
- runtime data
- metaobjects
- UI
- logging
- docs
- other

**Files changed**
- path/to/file.ext
- path/to/another-file.ext

**Summary**
- What changed

**Reason**
- Why the change was made

**Impact**
- What behavior changed for users or developers

**Risk / Regression check**
- Any area that may be affected
- What should be re-tested

**Rollback note**
- How this could be reverted if needed

---

## Entries

### 2026-05-08 - Refine component compare UI with inline filters, game rail, and beta advisory

**Area**
- FPS Finder
- UI
- docs

**Files changed**
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Reworked the compare-only Resolution and Preset controls into inline label-and-chip rows.
- Turned the selected games list into a one-line horizontal rail with icon-bearing pills plus Prev/Next carousel controls.
- Added game icons into the compare graph row headers and changed the delta badge to an estimated percentage versus Pair A.
- Added a top-of-compare beta advisory so the graph is framed as directional guidance rather than guaranteed real-world FPS.

**Reason**
- The compare workspace needed to scan faster and communicate its limitations more clearly.
- The previous wrapped game pills and literal FPS-difference badge made the surface feel denser and more authoritative than intended.

**Impact**
- Compare mode now reads more like a guided benchmarking tool than a raw data dump.
- Users can move through longer game lists horizontally without the compare layout growing vertically.
- The percentage badge plus advisory banner reduce the risk of shoppers treating the graph as a guaranteed FPS promise.

**Risk / Regression check**
- Re-test desktop and mobile compare mode with long game lists.
- Re-test game selection, scroll controls, and swipe/trackpad horizontal scrolling on the game rail.
- Re-test delta badge visibility when one side has no benchmark row.
- Re-test compare-only resolution and preset controls and confirm they still update the graph.

**Rollback note**
- Revert the compare-mode UI refinements in the FPS Finder JS and CSS to restore the earlier wrapped game pills, stacked filter fields, and FPS-difference delta wording.

### 2026-05-08 - Redesign component-centric compare into top-level compare mode

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Moved component-centric compare out of the selected-pair result card and into a dedicated page-state workspace driven by a top Compare button in the section intro.
- Added separate Pair A and Pair B CPU/GPU selectors, compare-only resolution and preset controls, and a game picker above the grouped Average FPS graph.
- Kept the existing game-centric compare flow unchanged.
- Synced Pair A back into the main component-centric browse selection when the shopper exits compare mode.

**Reason**
- The inline compare surface was too constrained once the requirement expanded to two full pair pickers, explicit game selection, and compare-local resolution and preset controls.
- Compare mode needed to behave like a first-class workflow rather than a result-card expansion.

**Impact**
- Component-centric mode now has two visual states:
  - normal browse mode
  - compare mode
- Compare mode owns its own pair selections and graph filters while it is open.
- Leaving compare mode updates the normal component-centric CPU/GPU selection to match Pair A so the main browse state stays aligned with the comparison workflow.

**Risk / Regression check**
- Re-test component-centric browse mode with compare closed.
- Re-test entering compare mode with and without a main CPU/GPU pair already selected.
- Re-test Pair A sync-back on compare close.
- Re-test compare with:
  - only Pair A selected
  - Pair A plus Pair B selected
  - multiple selected games
  - missing benchmark rows on one side
  - the same pair on both sides
- Confirm the game-centric compare flow still behaves exactly as before.

**Rollback note**
- Revert the top compare-mode changes in the FPS Finder section, JS, and CSS to restore the older inline component-centric compare panel.

### 2026-05-08 - Add component-centric compare graph for selected games

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a new compare toggle inside component-centric mode so the shopper can keep the current CPU + GPU pair as the baseline and choose one alternate pair.
- Added a selected-games picker and a grouped horizontal graph that compares Average FPS for the baseline pair versus the alternate pair across the shopper's chosen games.
- Reused the existing pair benchmark endpoint for both pairs instead of introducing a new compare-specific payload.
- Kept the current game-centric compare flow unchanged.

**Reason**
- Component-centric mode already answers how one selected pair performs across games.
- The next requirement is to compare two shopper-picked pairs visually without leaving the same page flow or replacing the existing game-centric recommendation compare UI.

**Impact**
- Component-centric mode can now open an inline compare panel below the selected-pair result card.
- The compare graph stays tied to the current global resolution and preset, keeps shopper-chosen games visible even when one side has no benchmark row, and clearly labels missing sides instead of plotting zero.
- Baseline PC Builder handoff remains unchanged and still points to the currently selected main pair.

**Risk / Regression check**
- Re-test component-centric mode with compare closed and confirm the original pair-browsing flow still works.
- Re-test compare with:
  - one chosen game
  - multiple chosen games
  - no chosen games
  - alternate pair identical to the baseline
  - one pair missing benchmark rows for a selected game
- Re-test changing the main CPU/GPU pair while compare is open and confirm the graph updates without losing the chosen games selection.
- Re-test game-centric mode and confirm its existing compare panel behavior is unchanged.

**Rollback note**
- Remove the component-centric compare state/rendering from `assets/ucp-fps-finder.js` and the related compare graph styles from `assets/ucp-fps-finder.css` to return component-centric mode to single-pair browsing only.

### 2026-05-07 - Add component-centric FPS Finder mode with pair benchmark browsing

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- templates/page.ucp-fps-finder-pair-json.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added an admin-only `finder_mode` setting so the current page can render either `Game Centric FPS Finder` or `Component Centric FPS Finder`.
- Preserved the current game-centric recommendation and compare experience as the default mode.
- Added a new pair benchmark endpoint that serves benchmark rows across all enabled games for one exact `bench_cpu_handle` + `bench_gpu_handle` pair.
- Added a new component-centric runtime where shoppers select a live storefront CPU and GPU, keep global resolution and preset controls, then browse game FPS results through a focused hero card plus carousel/picker.
- Kept the PC Builder handoff stateless and still based on the selected CPU and GPU variant IDs.

**Reason**
- The existing FPS Finder is game-first and recommendation-first.
- The new requirement is to support a second shopper flow where the exact CPU and GPU pair is chosen first, then performance is explored across games without replacing the current mode.

**Impact**
- Merchants can now switch FPS Finder behavior in Theme Editor / Liquid without changing page routes.
- The new component-centric mode shows FPS + tier for the selected pair when benchmark data exists, keeps no-benchmark games browseable, and clearly shows unsupported or below-floor states.
- The current game-centric mode remains available and unchanged for storefront rollout safety.

**Risk / Regression check**
- Re-test both `finder_mode` values and confirm only the intended mode renders.
- Re-test game-centric recommendations, compare, and PC Builder CTA handoff to confirm no behavior changed there.
- Re-test component-centric browsing with:
  - no pair selected
  - a pair with benchmark coverage
  - a pair with no benchmark coverage
  - a game that lacks authored support for the selected resolution
- Re-test the new pair endpoint and confirm it returns JSON for `?view=ucp-fps-finder-pair-json&cpu_bench=...&gpu_bench=...`.

**Rollback note**
- Remove the new `finder_mode` setting and `page.ucp-fps-finder-pair-json.liquid`, then revert the component-centric branch in the section, JS, CSS, and architecture notes to return the page to game-centric-only behavior.

### 2026-05-07 - Add banner-first Gamer's Den UI refresh

**Area**
- FPS Finder
- UI
- runtime data
- metaobjects
- docs

**Files changed**
- templates/page.ucp-fps-finder-json.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md
- Requirement/FPS_FINDER_Metaobjects.md

**Summary**
- Added the new game `banner` asset to the FPS Finder game index payload as `banner_url`.
- Reworked the selected-game area into a full-stage banner hero with banner-first media precedence and background-image fallback.
- Refreshed the FPS Finder shell, controls, recommendation cards, tier sections, compare panel, and state surfaces into a darker glassmorphic Gamer's Den presentation with RGB aura glow.
- Kept benchmark filtering, ranking, compare logic, and PC Builder handoff unchanged.

**Reason**
- The previous FPS Finder page was functionally correct but visually flat relative to the rest of the gaming-focused storefront.
- The new banner field needed a defined rendering role so each game can feel more immersive without changing the recommendation contract.

**Impact**
- Each enabled game can now drive a stronger hero presentation through the new `banner` field.
- The page feels more premium and immersive while preserving the same shopper inputs and recommendation behavior.
- Background video remains future-ready in the payload, but the current hero intentionally stays banner-first.

**Risk / Regression check**
- Re-test switching between multiple enabled games and confirm the hero art, notes, recommendation cards, and compare section all stay in sync.
- Re-test a game without a banner and confirm the hero falls back to `background_image` cleanly.
- Re-test one recommendation CTA, one tier CTA, and one compare CTA to confirm the stateless PC Builder handoff still uses the same CPU/GPU prefill flow.
- Re-test mobile widths and confirm the hero text, chips, and controls do not overflow.

**Rollback note**
- Remove `banner_url` from the game index and revert the appended Gamer's Den CSS / selected-game render path to restore the earlier compact selected-game card design.

### 2026-04-14 16:28 - Add builder fallback and FPS Finder source logging

**Area**
- FPS Finder
- PC Builder handoff
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- ../PC Builder 2/assets/ucp-pcb-build-link.js
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md
- ../docs/FPS_FINDER_PC_BUILDER_HANDOFF.md

**Summary**
- Added a runtime fallback so FPS Finder recommendation buttons still build a PC Builder link when the section's `PC Builder page URL` setting is blank.
- The fallback path is `/pages/pc-builder-2`.
- Kept the existing stateless CPU/GPU prefill contract unchanged.
- Marked the handoff links with `src=fps_finder`.
- Added a one-time `fps_finder` log event in PC Builder when a marked handoff successfully restores parts from FPS Finder.

**Reason**
- The storefront buttons were rendering `Builder link unavailable`, which means the handoff had valid CPU/GPU variant IDs but no usable builder destination URL.

**Impact**
- Recommendation, tier, and compare CTAs can now open PC Builder with CPU and GPU prefilled even when the section setting has not been populated yet.
- The configured `PC Builder page URL` setting still wins when it is present.
- PC Builder logs now show an explicit `fps_finder` event for successful arrivals from FPS Finder.

**Risk / Regression check**
- Re-test one top-card click, one tier-card click, and one compare-card click and confirm the destination URL contains `cpu` and `gpu`.
- Confirm those links also carry `src=fps_finder`.
- Confirm PC Builder logs the `fps_finder` event after the marked handoff restores CPU and/or GPU.
- Re-test on a store where the actual PC Builder page does not live at `/pages/pc-builder-2`; in that case the Theme Editor URL setting should be filled and should override the fallback.

**Rollback note**
- Remove the runtime fallback and return to Theme-Editor-only builder URL configuration if the store should no longer assume `/pages/ucp-pc-builder`.

### 2026-04-14 16:16 - Document the current stateless PC Builder handoff

**Area**
- FPS Finder
- PC Builder handoff
- docs

**Files changed**
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md
- ../docs/FPS_FINDER_PC_BUILDER_HANDOFF.md

**Summary**
- Added a dedicated cross-feature reference doc for the current FPS Finder to PC Builder handoff.
- Documented that the live click path remains a minimal stateless handoff using `?cpu=<variantId>&gpu=<variantId>`.
- Linked the FPS Finder architecture notes to the new handoff doc so future changes have one stable reference.

**Reason**
- This integration is critical to the storefront and should be easy to trace before future resume or save work is added.
- The current phase intentionally avoids changing PC Builder behavior, so the main deliverable is a clear handoff reference instead of new runtime logic.

**Impact**
- Future work on FPS Finder -> PC Builder linking now has a dedicated reference file in `docs`.
- Current storefront behavior remains unchanged: recommendation clicks still prefill CPU and GPU only.

**Risk / Regression check**
- Re-test one top-card click, one tier-card click, and one compare-card click to confirm PC Builder still opens with CPU and GPU prefilled.
- Confirm no quote, approval, share, or full-build restore behavior changed in this pass.

**Rollback note**
- Remove the new handoff doc and the architecture cross-reference if this integration note is no longer needed.

### 2026-04-14 15:31 - Make top recommendation cards slot-configurable and add Best Budget

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.js
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Replaced the hardcoded top recommendation lineup with 3 ordered Theme Editor slots.
- Added a new `Best Budget` lane that picks the lowest-price mapped combo that reaches the first FPS floor when possible.
- Kept `Best Starting Point` as an optional lane type instead of a built-in default.
- Added duplicate-avoidance across the 3 top cards so later slots try to use a different CPU + GPU pair before falling back to a duplicate.

**Reason**
- `Best Starting Point` and `Best Value` could collapse to the same CPU + GPU pair too often.
- Merchandising needs control over which recommendation lanes appear and in what order without changing JS each time.

**Impact**
- Default top-row order is now `Best Budget`, `Best Value`, and `Better Upgrade Path`.
- Merchants can switch any of the 3 top cards to `Best Budget`, `Best Value`, `Better Upgrade Path`, or `Best Starting Point`.
- `Best Budget` now gives the clearest minimum-spend entry point for the active game, resolution, and preset.

**Risk / Regression check**
- Re-test Theme Editor slot changes and confirm the top row renders in the configured order.
- Re-test a context where `Best Budget` and `Best Value` would have matched previously and confirm the second slot now tries to surface a distinct combo.
- Re-test a context where no combo reaches the first FPS floor and confirm `Best Budget` falls back to the cheapest valid mapped combo with the correct rationale text.
- Re-test `Best Starting Point` when selected in any slot and confirm its threshold settings still affect the result.

**Rollback note**
- Restore the previous fixed-lane row and remove the slot settings if merchants should no longer control the top recommendation order.

### 2026-04-14 13:31 - Add recommendation layer V2 above the tier sections

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a new 3-card recommendation layer above the existing tier sections with Best Starting Point, Best Value, and Better Upgrade Path.
- Reworked Best Value to rank by FPS per peso using `avg / total_cpu_gpu_starting_price` instead of lowest absolute price.
- Added configurable section settings for Best Starting Point minimum FPS gain and maximum price increase over Best Value.
- Added Better Upgrade Path logic that resolves CPU platform from `shopify.processor-socket`, already exposed in the product feed as `compat.processor_sockets`.
- Tightened the tier layout so single-card tiers no longer feel oversized relative to the new top row.

**Reason**
- The previous FPS Finder page was benchmark-correct but too exploration-heavy at the top.
- Shoppers needed faster first-click guidance without changing stable benchmark matching, compare behavior, or PC Builder handoff.

**Impact**
- FPS Finder now surfaces a clear recommendation layer before the tier sections.
- The top recommendation row reuses the same benchmark-backed candidate set as the tier sections, so no unsupported combinations are invented.
- Compare mode remains secondary and the builder handoff remains the same stateless CPU/GPU URL flow.

**Risk / Regression check**
- Re-test game, resolution, and preset changes to confirm the recommendation row and tier sections stay in sync.
- Re-test Best Value on a context with multiple valid combos and confirm the winner is no longer simply the cheapest total-price combo.
- Re-test at least one AM4-vs-AM5 context and confirm Better Upgrade Path prefers AM5 only when a valid mapped option exists.
- Re-test compare mode and PC Builder handoff after clicking cards from both the new top row and the existing tier sections.

**Rollback note**
- Revert the new recommendation-row render path and restore the previous tier-only top-of-page behavior if the new lane logic or platform labeling proves unreliable.

### 2026-03-26 - Add benchmark-backed compare flow

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a compare panel that opens from each recommendation card and lets shoppers compare another CPU + GPU combo against the current recommendation.
- Kept the compare flow benchmark-backed by limiting it to CPU/GPU handle combinations that exist in the currently selected game, resolution, and preset.
- Added side-by-side comparison output for FPS, tier reached, CPU + GPU anchor price, and builder handoff.

**Reason**
- The main recommender remains value-first, which often keeps the same CPU baseline while only changing GPU tiers.
- Shoppers need a safe way to test another CPU + GPU combination without turning FPS Finder into a second full PC Builder.

**Impact**
- Each recommendation card now exposes a `Compare another combo` action.
- The compare UI resets when game, resolution, or preset changes so the benchmark comparison stays tied to the active selection.
- Compare results only render when there is an exact benchmark row for the selected CPU handle and GPU handle pair.

**Risk / Regression check**
- Re-test the compare button across primary and alternate recommendation cards.
- Re-test compare states where the chosen CPU/GPU pair has no benchmark row and confirm the empty compare message appears cleanly.
- Re-test builder handoff from the compared combo and confirm the selected CPU and GPU still prefill in PC Builder.

**Rollback note**
- Remove the compare container from `sections/ucp-fps-finder.liquid` and revert the compare state/render logic in `assets/ucp-fps-finder.js` along with the compare UI styles in `assets/ucp-fps-finder.css`.

### 2026-03-26 - Add one meaningful alternate per tier

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Kept the cheapest qualifying CPU + GPU combo as the primary recommendation in each tier.
- Added one optional alternate card in the same tier when it provides materially higher FPS headroom instead of acting like a near-duplicate SKU.
- Updated tier copy and card flag styling so shoppers can distinguish the default floor recommendation from the alternate.

**Reason**
- The one-card-per-tier curation cleaned up the output, but it removed too many useful alternatives for shoppers who want one stronger option without reopening the full benchmark matrix.
- The tier UI should stay curated and explainable instead of rendering every mapped CPU and GPU combination again.

**Impact**
- Each tier now shows one primary recommendation and, when available, one higher-headroom alternate.
- Alternates only appear when they are meaningfully different from the primary benchmark-handle pair.

**Risk / Regression check**
- Re-test tiers that previously showed exactly one card and confirm a second card appears only when it has real extra headroom.
- Re-test dense benchmark coverage and confirm board-partner duplicates still stay collapsed.
- Re-test empty and single-tier states to confirm layout and CTA behavior remain stable.

**Rollback note**
- Revert the alternate-card helper in `assets/ucp-fps-finder.js` and remove the secondary flag styling in `assets/ucp-fps-finder.css` to return to one card per tier.

### 2026-03-26 - Add shopper preset selector

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- sections/ucp-fps-finder.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a shopper-visible preset selector with `Low`, `Medium`, and `High` chips.
- Defaulted the selected preset from each game's linked FPS profile while allowing the shopper to override it.
- Added legacy preset normalization so `med` benchmark rows resolve to `medium`.

**Reason**
- Benchmark coverage now spans multiple presets, so FPS Finder needs an explicit shopper control instead of forcing the hidden profile preset for every visit.
- Preset selection should stay inside FPS Finder while keeping the curated one-card-per-tier recommendation model intact.

**Impact**
- FPS Finder now filters benchmark rows by selected game, selected resolution, and selected preset.
- The linked game profile's `default_preset` is still the starting value, but it is no longer the only preset a shopper can use.
- The storefront now shows a preset control beside game and resolution.

**Risk / Regression check**
- Re-test games with mixed `low`, `medium`, and `high` benchmark coverage and confirm preset switching changes the recommendation set.
- Re-test legacy rows that still use `med` and confirm they appear under `Medium`.
- Re-test empty states when a shopper selects a preset with no qualifying rows.

**Rollback note**
- Revert the preset UI and state changes to return FPS Finder to profile-default-preset-only behavior.

### 2026-03-26 - Curate one benchmark-handle starting point per tier

**Area**
- FPS Finder
- UI
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- sections/ucp-fps-finder.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Changed FPS Finder recommendation ranking to curate one CPU + GPU starting point per tier.
- Collapsed recommendation expansion to benchmark handle pairs instead of rendering every mapped live product combination.
- Updated shopper-facing copy to describe curated starting points rather than every qualifying combo.

**Reason**
- The previous runtime surfaced too many near-duplicate CPU and GPU combinations, especially when multiple live products shared the same benchmark handles.
- The FPS Finder output should act as a clear starting point before handing off to PC Builder, not as a second full configurator.

**Impact**
- Each tier now shows only the cheapest qualifying benchmark-handle pair mapped to the cheapest live CPU and GPU entries for that pair.
- Ranking now prefers lowest CPU + GPU anchor price first, then the smallest positive FPS headroom above that tier's minimum threshold.
- Board-partner duplicates are collapsed by default because the recommendation unit is the benchmark handle pair, not every mapped SKU combination.

**Risk / Regression check**
- Re-test games with many mapped GPU models and confirm only one primary card renders per tier.
- Re-test that the selected CPU and GPU still deep-link into PC Builder correctly.
- Re-test unavailable benchmark-handle mappings and confirm the CTA disable setting still behaves correctly.

**Rollback note**
- Revert the recommendation builder and copy changes to restore the previous "show every mapped combo" behavior.

### 2026-03-25 - Prefer direct benchmark handles on benchmark_entry

**Area**
- FPS Finder
- runtime data
- metaobjects
- docs

**Files changed**
- templates/page.ucp-fps-finder-game-json.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Updated the selected-game benchmark feed to prefer `benchmark_entry.cpu_bench_handle` and `benchmark_entry.gpu_bench_handle`.
- Added compatibility fallbacks for legacy `benchmark_entry.cpu_handle` and `benchmark_entry.gpu_handle`.
- Added `fps` as a final average-FPS fallback after `avg` and `fps_avg`.
- Kept linked CPU/GPU product metafields as a fallback for older benchmark rows.

**Reason**
- Benchmark rows are authored against chipset-level performance identity, not a single storefront GPU/CPU model.
- The existing PC Builder performance preview still reads benchmark identity from `cpu_handle` and `gpu_handle`.
- Requiring linked products caused valid rows to be dropped when benchmark entries intentionally omitted `gpu_product` or `cpu_product`.

**Impact**
- FPS Finder can now include benchmark rows that define direct benchmark handles even when the linked GPU or CPU product reference is blank.
- FPS Finder now accepts both the newer benchmark-handle field names and the older handle fields already used by the PC Builder performance preview.
- One benchmark row can continue mapping to multiple live storefront products that share the same benchmark handle.

**Risk / Regression check**
- Re-test `/pages/fps-finder?view=ucp-fps-finder-game-json&game=rdr2` and confirm rows with direct benchmark handles now appear.
- Re-test games that still rely on linked CPU/GPU product references and confirm those rows still serialize correctly.
- Re-test FPS Finder recommendations on the storefront for preset filtering and live product mapping.

**Rollback note**
- Revert the selected-game template handle-resolution block to return to product-metafield-only benchmark identity.

### 2026-03-25 - Selected-game query-string parsing fix

**Area**
- FPS Finder
- runtime data
- docs

**Files changed**
- templates/page.ucp-fps-finder-game-json.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Replaced the selected-game endpoint's `request.params` query lookup with URL parsing from `content_for_header`.
- Documented the Shopify storefront query-string constraint in the architecture notes.

**Reason**
- The selected-game benchmark feed was returning an empty `game_handle` even when the storefront requested `?game=cs-2`, because generic query params were not available through `request.params` in the page template context.

**Impact**
- `page.ucp-fps-finder-game-json.liquid?game=<handle>` can now resolve the requested game handle in the storefront template and return benchmark rows for that game.

**Risk / Regression check**
- Re-test `/pages/fps-finder?view=ucp-fps-finder-game-json&game=cs-2` and confirm `game_handle` is populated and benchmark rows return.
- Re-test the FPS Finder page and confirm switching games still loads the correct recommendation set.
- Keep an eye on future query parsing if generated per-game payload URLs replace this endpoint.

**Rollback note**
- Revert the selected-game template query parsing block if the endpoint is later redesigned to avoid storefront query-string parsing altogether.

### 2026-03-25 - Split FPS Finder into game index and selected-game benchmark feed

**Area**
- FPS Finder
- runtime data
- UI
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- templates/page.ucp-fps-finder-json.liquid
- templates/page.ucp-fps-finder-game-json.liquid
- assets/ucp-fps-finder.js
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Reworked FPS Finder so the first page load fetches only enabled game/profile metadata.
- Added a new selected-game benchmark endpoint that serves benchmark rows only for the active game.
- Updated the runtime to cache game-level benchmark payloads and preserve the existing tier rendering and builder handoff behavior.

**Reason**
- The benchmark corpus has grown enough that boot-time full-corpus fetching is no longer the right default.
- The storefront needed a smaller initial payload without breaking the existing recommendation UI and rules.

**Impact**
- FPS Finder now loads games first and only requests benchmark rows when a specific game is selected.
- The current UI, tier logic, product mapping, and PC Builder handoff remain intact.
- This is a smaller, safer intermediate step toward a future fully generated per-game serving layer.

**Risk / Regression check**
- Re-test `/pages/fps-finder` and confirm the first load succeeds without needing the full benchmark corpus first.
- Re-test switching between multiple games and confirm each game loads results after its own benchmark request completes.
- Re-test `cs-2`, `cyberpunk`, and at least one newly covered game to confirm tier rendering still behaves correctly.
- Re-test `/pages/fps-finder?view=ucp-fps-finder-json` and `/pages/fps-finder?view=ucp-fps-finder-game-json&game=cs-2`.

**Rollback note**
- Revert the section, template, JS, and documentation changes to return to the previous single-endpoint FPS Finder runtime.

### 2026-03-21 - Tier-list expansion and cursor-safe benchmark feed

**Area**
- FPS Finder
- runtime data
- UI
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- templates/page.ucp-fps-finder-json.liquid
- assets/ucp-fps-finder.js
- assets/ucp-fps-finder.css
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Expanded FPS Finder from one cheapest recommendation per tier to full tier-grouped lists of benchmark-backed CPU and GPU combinations.
- Changed the runtime to keep all mapped storefront CPU/GPU products for each canonical benchmark handle instead of collapsing to one cheapest product.
- Added a cursor-safe `next_url` contract to the FPS Finder read model and updated the runtime to follow Shopify pagination until the benchmark feed is complete.
- Added a section setting that can disable recommendation CTAs when mapped parts are unavailable, while leaving the current default behavior enabled.
- Hid games from the selector unless they can render at least one benchmark-backed recommendation.

**Reason**
- Shoppers were only seeing a single CPU/GPU pair like `7500F + 5070 Ti` because the runtime intentionally kept one cheapest winner per tier.
- Some enabled games appeared in the selector without results because the benchmark feed was not reliably advancing past the first page.
- Merchandising needed broader hardware visibility without breaking the existing stateless PC Builder handoff.

**Impact**
- FPS Finder now shows all mapped CPU/GPU combinations that satisfy each authored FPS tier, with the cheapest qualifying combo leading the section.
- Games with valid benchmark coverage on later pages can now load once the runtime follows Shopify's emitted pagination URL.
- Empty games no longer clutter the selector.
- Unavailable mapped products can still appear in recommendations, and CTA disabling is now configurable in the section settings.

**Risk / Regression check**
- Re-test `/pages/fps-finder` and confirm later-page games now appear once they have benchmark rows and mapped products.
- Re-test `cs-2` and `cyberpunk` to confirm each tier now shows multiple price-sorted combinations instead of one winner.
- Re-test a game with unavailable mapped products and confirm the CTA respects the new section checkbox.
- Re-test builder handoff and confirm `cpu` and `gpu` URL params still auto-apply as expected.

**Rollback note**
- Revert the FPS Finder section, read-model, JS, CSS, and documentation updates to return to the previous single-card-per-tier behavior and numeric-page benchmark fetching.

### 2026-03-21 - Read-model pagination loop guard

**Area**
- FPS Finder
- runtime data
- docs

**Files changed**
- assets/ucp-fps-finder.js
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a pagination guard in the FPS Finder runtime so read-model fetches stop when `next_page` does not advance.
- Added benchmark-row deduplication during read-model pagination.
- Documented the repeated-`next_page` storefront endpoint behavior in the architecture notes.

**Reason**
- The live FPS Finder page endpoint was returning a repeating `next_page: 2`, which caused the frontend to loop until it hit the pagination safety limit and fail to boot.

**Impact**
- FPS Finder can now continue rendering with the unique benchmark rows already returned instead of crashing on a repeated page pointer.
- This should unblock CS2 and other games that already exist in the first valid benchmark page.

**Risk / Regression check**
- Re-test `/pages/fps-finder` after deploying the updated JS asset and confirm the console no longer shows `read model pagination exceeded the safety limit`.
- Re-test `/pages/fps-finder?view=ucp-fps-finder-json` and confirm repeated `next_page` values no longer break the UI.
- The change only affects pagination fallback behavior and does not alter ranking logic.

**Rollback note**
- Revert the pagination guard and dedupe block in `assets/ucp-fps-finder.js` if the read-model endpoint is later replaced with a strictly correct paginator.

### 2026-03-21 - Benchmark field-key compatibility fix

**Area**
- FPS Finder
- runtime data
- docs

**Files changed**
- templates/page.ucp-fps-finder-json.liquid
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Updated the FPS Finder read model to accept `benchmark_entry.presets` as a fallback for `preset`.
- Updated the FPS Finder read model to accept `benchmark_entry.fps_avg` as a fallback for `avg`.
- Documented the live benchmark field-key compatibility in the architecture notes.

**Reason**
- The live `benchmark_entry` definition uses `fps_avg`, and the existing read model was only reading `avg`, which caused benchmark rows to be skipped.
- The benchmark entry UI also indicates a plural `Presets` field, so the read model now tolerates both field names.

**Impact**
- FPS Finder can now emit benchmark rows when the store uses `fps_avg` and `presets` instead of `avg` and `preset`.
- This should unblock games like `cs-2` from disappearing after the game list loads.

**Risk / Regression check**
- Re-test `https://www.uncappedpc.com/pages/fps-finder?view=ucp-fps-finder-json` after deploying this template and confirm `benchmarks` is no longer empty.
- Re-test CS2 specifically with preset `low` because the linked profile default preset is `low`.
- The change is additive and keeps the old field names as fallbacks.

**Rollback note**
- Revert the read-model field-key fallback lines if the benchmark definition is standardized back to only `avg` and `preset`.

### 2026-03-19 - Standalone threshold-based FPS Finder MVP

**Area**
- FPS Finder
- runtime data
- UI
- PC Builder handoff
- docs

**Files changed**
- sections/ucp-fps-finder.liquid
- assets/ucp-fps-finder.css
- assets/ucp-fps-finder.js
- templates/page.ucp-fps-finder-json.liquid
- templates/page.ucp-fps-finder.json
- Requirement/CHANGELOG.md
- Requirement/FPS_FINDER_ARCHITECTURE.md

**Summary**
- Added a standalone FPS Finder page section, page template, JSON read model, and runtime JS/CSS assets.
- Implemented threshold-based recommendation logic driven by linked `fps_game_profile` data.
- Reused existing `ucp-pc-builder-json` collection feeds for live CPU and GPU product resolution.
- Reused the existing PC Builder URL-param apply flow for stateless `cpu` and `gpu` handoff.

**Reason**
- To deliver the first customer-facing FPS Finder slice without modifying stable PC Builder behavior.
- To keep recommendation matching tied to canonical benchmark handles and live storefront inventory.

**Impact**
- FPS Finder can now render enabled games, supported resolutions, and up to three recommendation bands.
- Recommendation cards now open the existing PC Builder with CPU and GPU variant IDs prefilled.
- The FPS Finder workspace now owns a dedicated read model instead of depending on the current PC Builder perf preview endpoint.

**Risk / Regression check**
- Re-test the new `page.ucp-fps-finder-json.liquid` endpoint against live metaobject field keys, especially `fps_profile`, `fps_finder_enabled`, `background_image`, and `background_video`.
- Re-test that CPU and GPU collections expose `bench_cpu_handle` and `bench_gpu_handle` through the existing collection JSON template.
- Re-test builder handoff on a live page to confirm `cpu` and `gpu` URL params still auto-apply as expected.
- No existing PC Builder files were modified in this slice.

**Rollback note**
- Remove the newly added FPS Finder storefront files and revert the documentation updates to return to the pre-implementation state.

### YYYY-MM-DD - Initial documentation setup

**Area**
- docs

**Files changed**
- CHANGELOG.md
- CODEX_IMPLEMENTATION_OPERATING_MANUAL.md
- FPS_FINDER_ARCHITECTURE.md

**Summary**
- Created the initial operating manual, architecture document, and changelog structure for FPS Finder development.

**Reason**
- To ensure future implementation is traceable, maintainable, and easy to hand off.

**Impact**
- Establishes documentation and process requirements before development proceeds.

**Risk / Regression check**
- No production behavior changed.

**Rollback note**
- Remove the documentation files if process setup needs to be restarted from scratch.
