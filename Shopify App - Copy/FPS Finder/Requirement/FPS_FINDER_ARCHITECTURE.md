# FPS Finder Architecture
## Uncapped PC Shopify Theme
## Current Shopify Version: Horizon 3.1.0

This document describes the live FPS Finder implementation inside the isolated `FPS Finder` workspace.

---

## 1. Purpose

FPS Finder gives a shopper a fast starting point before the full PC Builder flow.

The current implementation supports two merchant-selectable modes on the same page:
- `Game Centric FPS Finder`
- `Component Centric FPS Finder`

The game-centric mode answers:
- which curated benchmark-backed CPU + GPU starting points are valid for this game
- at this target resolution
- using the shopper's selected benchmark preset, seeded from the game's authored default preset
- surfaced first as a slot-configurable 3-card recommendation layer, then grouped into authored FPS tiers below
- with one cheapest qualifying starting point per tier plus one optional higher-headroom alternate when it is materially different

The component-centric mode answers:
- how one exact selected CPU + GPU storefront pair performs across enabled games
- at the shopper's selected global resolution and preset
- with one focused game card at a time, supported by a game carousel/picker
- with an optional inline compare graph that keeps the current pair as baseline, lets the shopper choose one alternate pair, and compares selected games side by side
- while keeping games with no benchmark rows browseable instead of hiding them

In both modes, tier membership still comes from the linked `fps_game_profile`.

---

## 2. Live file structure

### 2.1 Storefront files
- `sections/ucp-fps-finder.liquid`
  - standalone UI shell
  - emits config JSON
  - exposes a merchant-facing mode toggle between game-centric and component-centric behavior
  - points to a lightweight game index endpoint on the current page
  - points to a selected-game benchmark endpoint on the current page
  - points to a pair benchmark endpoint on the current page
  - renders either the legacy game-centric controls and result hosts or the new component-centric controls and game browser hosts
  - reuses existing collection JSON feeds for CPU and GPU products
  - exposes a section setting that can disable recommendation CTAs when mapped parts are unavailable
  - exposes 3 ordered top-card lane settings so merchandising can choose which recommendation types appear
  - exposes section settings for the optional Best Starting Point lane's FPS-gain and price-cap thresholds

- `assets/ucp-fps-finder.css`
  - isolated styling for the section
  - renders the banner-first selected-game hero, glass controls, recommendation tiers, compare shell, and state surfaces
  - applies the Gamer's Den visual system with RGB aura glow and glassmorphic cards
  - does not depend on PC Builder CSS

- `assets/ucp-fps-finder.js`
  - fetches the FPS Finder game index first
  - fetches CPU and GPU collection JSON feeds
  - branches into game-centric or component-centric runtime based on the section setting
  - only fetches benchmark rows for the selected game in game-centric mode
  - fetches benchmark rows for one exact CPU + GPU benchmark pair across all games in component-centric mode
  - caches game-level benchmark payloads for page lifetime
  - caches pair-level benchmark payloads for page lifetime
  - normalizes games, profiles, benchmark rows, and product mappings
  - groups storefront products by benchmark handle, then chooses the cheapest mapped CPU and GPU entries for the winning handle pair
  - resolves CPU platform labels from `shopify.processor-socket`, already exposed as `compat.processor_sockets`
  - normalizes banner/background assets for each game and renders a banner-first hero without changing the recommendation pipeline
  - computes a slot-configurable top recommendation layer with Best Budget, Best Value, Better Upgrade Path, and an optional Best Starting Point lane in game-centric mode
  - avoids reusing the same CPU + GPU combo across the top cards when a distinct candidate exists
  - ranks Best Value by FPS per peso using `avg / (cpu price + gpu price)`
  - ranks Best Budget by the cheapest mapped combo that clears the first authored FPS floor when possible
  - computes one curated starting point per tier instead of rendering every mapped SKU combination
  - may add one alternate in the same tier when it offers meaningfully more FPS headroom without a disproportionate CPU + GPU price jump
  - lets shoppers compare another CPU + GPU benchmark pair against the current recommendation without leaving FPS Finder in game-centric mode
  - lets shoppers select an exact storefront CPU and GPU pair, then browse focused per-game FPS results in component-centric mode
  - lets shoppers open an inline compare panel in component-centric mode, select one alternate pair, choose which games to include, and render a grouped horizontal Average FPS graph
  - builds stateless handoff links into PC Builder

- `templates/page.ucp-fps-finder-json.liquid`
  - JSON game index for active games and linked profile data
  - exposes each game's `banner_url` plus existing icon/background assets for the selected-game hero
  - does not return benchmark rows

- `templates/page.ucp-fps-finder-game-json.liquid`
  - selected-game benchmark feed
  - returns only benchmark rows for the requested game
  - supports both `preset` / `presets` and `avg` / `fps_avg`
  - emits `next_url` so the runtime can follow Shopify pagination when one game's rows span multiple benchmark pages
  - parses `?game=<handle>` from `content_for_header` because generic query params are not reliably exposed on the Liquid `request` object

- `templates/page.ucp-fps-finder.json`
  - standalone page template that mounts the section

- `templates/page.ucp-fps-finder-pair-json.liquid`
  - pair benchmark feed for component-centric mode
  - returns benchmark rows across all enabled games for one exact `cpu_bench` + `gpu_bench` query
  - follows the same pagination-safety pattern as the selected-game feed
  - parses query params from `content_for_header` because generic request params are not reliably exposed in the storefront page template context

### 2.2 Reused existing theme files
- `PC Builder 2/templates/collection.ucp-pc-builder-json.liquid`
  - reused as the CPU and GPU product feed
  - source for variant IDs, prices, availability tier, benchmark metafields, and CPU `processor_sockets`

- `PC Builder 2/assets/ucp-pcb-build-link.js`
  - already applies `cpu` and `gpu` URL params in the builder
  - FPS Finder relies on that stable behavior instead of adding new handoff logic

---

## 3. Data model layers

### 3.1 `game` metaobject
Purpose:
- game identity
- display metadata
- enable/disable FPS Finder visibility
- link to a recommendation profile

Fields in use:
- `game_handle`
- `name`
- `icon`
- `banner`
- `background_image`
- `background_video`
- `fps_finder_enabled`
- `fps_profile`
- `genre`

Only entries with `fps_finder_enabled = true` and a linked `fps_profile` are emitted to the storefront game index.

The selected-game hero currently prefers:
- `banner`
- then `background_image`

`background_video` remains in the runtime payload for a later video-first pass, but it is not the active hero source yet.

### 3.2 `fps_game_profile` metaobject
Purpose:
- rules for one game's recommendation behavior

Fields in use:
- `profile_key`
- `default_preset`
- `allow_1080p`
- `allow_1440p`
- `allow_4k`
- `tier_1_key`
- `tier_1_label`
- `tier_2_key`
- `tier_2_label`
- `tier_3_key`
- `tier_3_label`
- per-resolution minimum FPS thresholds for each tier
- `bias_1080p`
- `bias_1440p`
- `bias_4k`
- `notes_short`

Bias fields are surfaced as authored notes only. They are not ranking inputs.

### 3.3 `benchmark_entry` metaobjects
Purpose:
- benchmark source-of-truth authoring layer

Fields in use:
- `key`
- `cpu_bench_handle`
- `gpu_bench_handle`
- `cpu_handle`
- `gpu_handle`
- `cpu_product`
- `gpu_product`
- `game`
- `resolution`
- `preset` or `presets`
- `fps_low`
- `fps_high`
- `avg`, `fps_avg`, or `fps`

The selected-game feed prefers canonical benchmark handles authored directly on `benchmark_entry`.

It also supports the legacy `cpu_handle` and `gpu_handle` fields already used by the older PC Builder performance preview.

Linked CPU and GPU products remain a fallback only so older entries can still resolve benchmark identity while the dataset is being normalized.

Product handles are never used as performance identifiers.

### 3.4 Product metafields
Canonical identifiers:
- `custom.bench_cpu_handle`
- `custom.bench_gpu_handle`

These are the only valid performance-matching keys for FPS Finder recommendation resolution.

---

## 4. Runtime data flow

### Step 1. The section loads its config
`sections/ucp-fps-finder.liquid` emits:
- `finder_mode`
- local page game index endpoint
- local page selected-game benchmark endpoint
- local page pair benchmark endpoint
- CPU collection JSON endpoint
- GPU collection JSON endpoint
- PC Builder target page URL
- a boolean that controls whether unavailable mapped parts should disable the CTA
- 3 ordered top-card lane settings:
  - `Best Budget`
  - `Best Value`
  - `Better Upgrade Path`
  - `Best Starting Point`
- two configurable thresholds for the optional Best Starting Point lane:
  - minimum FPS gain over Best Value
  - maximum allowed price increase over Best Value

### Step 2. The browser fetches the game index
`page.ucp-fps-finder-json.liquid` returns:
- active games
- each game's linked profile data
- each game's hero assets, including `banner_url`

This keeps the first request small even when the benchmark corpus grows.

### Step 3. The browser fetches CPU and GPU collection JSON
The runtime reads the existing `ucp-pc-builder-json` collection feeds to get:
- live variant IDs
- live prices
- availability states
- lead-time labels
- benchmark handle metafields
- CPU `compat.processor_sockets` values sourced from `shopify.processor-socket`

### Step 4. The shopper selects a game
When a game becomes active, the browser requests:
- `page.ucp-fps-finder-game-json.liquid?game=<game_handle>`

That endpoint returns:
- benchmark rows for the selected game only
- `next_url` if Shopify pagination still has more global benchmark pages to inspect

The runtime caches each game's benchmark rows after the first successful fetch.

The selected-game template reads the active game handle from the current page URL via `content_for_header`. This is a Shopify-specific workaround because generic query parameters were not available through `request.params` in the storefront template context.

At render time, the runtime updates the selected-game hero using banner-first media precedence and keeps the rest of the recommendation flow unchanged.

### Step 4B. The shopper selects a CPU + GPU pair
When component-centric mode is active, the browser:
- loads the same game index
- loads the same CPU and GPU collection feeds
- lets the shopper pick one live storefront CPU and one live storefront GPU
- resolves those selections to canonical benchmark handles
- requests:
  - `page.ucp-fps-finder-pair-json.liquid?cpu_bench=<bench_cpu_handle>&gpu_bench=<bench_gpu_handle>`

That endpoint returns benchmark rows across all enabled games for the selected pair.

The runtime then:
- applies the shopper's global resolution and preset filters
- joins the filtered benchmark rows back to the enabled game index
- keeps every enabled game browseable
- marks each focused game result as:
  - benchmarked
  - below first tier floor
  - no benchmark row
  - unsupported for the selected resolution

### Step 5. The runtime builds benchmark-handle catalogs
`assets/ucp-fps-finder.js` groups products by:
- `bench_cpu_handle` for CPUs
- `bench_gpu_handle` for GPUs

Selection rules:
- keep every mapped storefront product for each canonical benchmark handle
- choose one display/handoff variant per product
- prefer the cheapest available variant
- fall back to the cheapest variant even when the product is currently unavailable

This preserves the full mapping catalog while still letting the recommendation layer collapse each benchmark handle pair to one shopper-facing starting point.

### Step 6. The shopper selects resolution
Current shopper inputs:
- game, resolution, and preset in game-centric mode
- CPU, GPU, resolution, and preset in component-centric mode

Preset options are intentionally fixed to:
- `low`
- `medium`
- `high`

The runtime seeds the initial preset from the linked profile's `default_preset` and falls back to `medium` when the profile value is blank or unsupported.

### Step 7. Benchmark rows are filtered
The runtime keeps only rows that match:
- selected game
- selected resolution
- selected preset

### Step 8. Threshold bands are applied
Tier semantics are ascending:
- `tier_1` = lowest valid band
- `tier_3` = highest valid band

Band logic:
- `tier_1`: `avg >= tier_1_min` and below `tier_2_min`
- `tier_2`: `avg >= tier_2_min` and below `tier_3_min`
- `tier_3`: `avg >= tier_3_min`

A stronger combo only appears in the highest band it qualifies for. It does not repeat in lower tiers.

### Step 9. A slot-configurable top recommendation layer is resolved from the same candidate set
The runtime first resolves ranked lane outputs from the valid mapped CPU + GPU candidate set, then fills the 3 configured top-card slots in the merchant-selected order.

Supported lane types:
- `Best Budget`
- `Best Value`
- `Better Upgrade Path`
- `Best Starting Point`

Default slot order:
- `Best Budget`
- `Best Value`
- `Better Upgrade Path`

Best Budget:
- targets the first authored FPS floor: `tier_1_min`
- ranks qualifying mapped combos by lowest total CPU + GPU price
- tie-breaks by higher FPS, then availability
- if no mapped combo reaches the floor, falls back to the cheapest valid mapped combo for the current context

Best Value:
- ranks by `fps_per_peso = avg / total_cpu_gpu_starting_price`
- tie-breaks by lower price, then higher FPS, then availability

Best Starting Point:
- resolves after Best Value
- uses configurable merchant thresholds for:
  - minimum FPS improvement over Best Value
  - maximum price increase over Best Value
- falls back to Best Value when no distinct candidate qualifies

Better Upgrade Path:
- prefers a valid AM5 CPU path over AM4 when a sensible mapped option exists
- uses the existing CPU `shopify.processor-socket` values already exposed in the product feed
- falls back to the strongest sensible alternate when no clearer newer-platform path exists

The slot filler avoids reusing the same CPU + GPU combo across the 3 top cards when a distinct lane-ranked candidate exists. If the active result set is too small, duplication is allowed as a last resort instead of hiding a slot.

If price data is invalid, the price-driven lanes fall back safely to benchmark-backed alternates instead of disappearing.

### Step 10. Each tier is curated at the benchmark-handle level
For each matching benchmark row:
- resolve the cheapest mapped CPU product by `bench_cpu_handle`
- resolve the cheapest mapped GPU product by `bench_gpu_handle`
- treat `game + resolution + preset + cpu_handle + gpu_handle` as the recommendation unit
- deduplicate repeated benchmark rows that point at the same benchmark handle pair
- rank by CPU + GPU starting price ascending, then by the smallest positive FPS headroom above the tier minimum

Each tier now returns one primary starting point. It may also return one alternate when the benchmark-handle pair is not a near-duplicate, delivers at least a 10% FPS uplift versus the primary card, and stays within a 35% CPU + GPU price jump. The output remains intentionally curated rather than exhaustive.

### Step 11. Stateless builder handoff
Each result card builds a URL in this shape:
- `builder_page_url?cpu=<variantId>&gpu=<variantId>&src=fps_finder`
- if the section setting is blank, the runtime falls back to `/pages/pc-builder-2`

FPS Finder does not create quote codes and does not add new routing. The existing builder apply flow remains the owner of URL-param application.
When PC Builder sees `src=fps_finder` on a successful handoff restore, it logs the `fps_finder` event through the existing PC Builder logger so entry origin is visible in builder logs.
For the cross-feature reference of this handoff, see `docs/FPS_FINDER_PC_BUILDER_HANDOFF.md`.

If a card's mapped parts are unavailable:
- the card still renders
- the CTA remains enabled by default
- the section setting can disable the CTA later without changing the JS contract

### Step 12. Compare flow
Each recommendation card can open a compare panel tied to the currently active:
- game
- resolution
- preset

The compare panel:
- treats the clicked recommendation as the baseline
- lets the shopper choose another benchmark-backed CPU handle and GPU handle
- only resolves a comparison when an exact benchmark row exists for that CPU/GPU handle pair
- maps the chosen handles to the cheapest live CPU and GPU products for builder handoff
- shows FPS delta, price delta, and tier shift versus the baseline recommendation

The compare state is reset when game, resolution, or preset changes so the comparison cannot drift into a stale benchmark context.

### Step 12B. Component-centric compare graph
Component-centric mode has its own dedicated compare page state.

The component-centric compare mode:
- is opened from a top Compare button in the FPS Finder intro
- temporarily replaces the normal single-pair browse surfaces with a dedicated compare workspace
- seeds Pair A from the current component-centric CPU and GPU selection
- starts Pair B empty so the shopper explicitly chooses a second pair
- exposes two full CPU + GPU selectors:
  - Pair A
  - Pair B
- exposes compare-only resolution and preset controls above the graph
- lets the shopper choose which games to include in the comparison
- renders the compare-only resolution and preset selectors as inline label-and-chip rows for faster scanning
- renders the chosen-games picker as a one-line horizontal rail with game icons plus Prev/Next scroll controls
- fetches Pair A and Pair B through the same pair endpoint already used by the normal component-centric runtime
- renders a grouped horizontal graph using Average FPS only
- renders a game icon before each compare row title when icon data exists
- shows an estimated percentage delta versus Pair A instead of a literal FPS-difference label
- keeps selected games visible even when one side has no benchmark row and labels that side instead of plotting zero
- exposes one PC Builder handoff CTA per pair
- shows a beta advisory banner near the top of compare mode so users treat the graph as directional guidance rather than guaranteed real-world FPS

When compare mode closes, Pair A syncs back into the main component-centric CPU/GPU browse selection so the normal page state stays aligned with the comparison workflow.

---

## 5. Why FPS Finder has its own read model

The current PC Builder performance preview endpoint is not a safe direct dependency for FPS Finder because it does not expose the full linked game/profile contract needed by the feature.

FPS Finder therefore owns its own read model for:
- enabled games
- linked profile thresholds and labels
- selected-game benchmark rows normalized around canonical benchmark handles
- Shopify pagination handoff through `next_url`

This keeps the implementation isolated and avoids changing stable PC Builder files.

---

## 6. Recommendation behavior

Current shopper-visible behavior:
- choose a game
- choose a supported resolution
- choose a preset
- see a top recommendation row before the tier sections
- top row always includes 3 cards, but the merchant can choose their lane types and order in Theme Editor
- default top row includes:
  - Best Budget
  - Best Value
  - Better Upgrade Path
- Best Starting Point remains available as an optional top-card lane
- see one or more tier sections
- each tier section shows one curated CPU + GPU starting point for that FPS band
- a tier may show one additional higher-headroom alternate when it is meaningfully different from the primary card
- cards are labeled either as the lowest qualifying combo or as a more-headroom option
- each card shows average FPS, estimated CPU + GPU starting price, resolved live CPU/GPU parts, and availability state
- top recommendation cards also show rationale text and platform label when CPU socket data is reliable
- each card can open a compare panel for another benchmark-backed CPU + GPU combination
- click into PC Builder with the CPU and GPU prefilled

Current hidden behavior:
- games load before benchmark rows
- benchmark rows are loaded only for the active game
- preset defaults from the linked profile and can be overridden by the shopper
- ranking is price-first at the benchmark-handle-pair level within each threshold band
- Best Budget is ranked against the first authored FPS floor and falls back to the cheapest valid mapped combo when that floor is unreachable
- Best Value is ranked by FPS per peso, not lowest absolute price
- Best Starting Point is optional and gated by merchant-configurable FPS-gain and price-cap thresholds when used in a top-card slot
- Better Upgrade Path uses CPU `shopify.processor-socket` data and currently treats `AM5` as preferable to `AM4`
- the top-card row tries to avoid showing the same CPU + GPU combo twice when the active result set has enough distinct candidates
- smaller positive headroom above the tier minimum wins after price
- a second card is only shown when the FPS uplift is material instead of acting like a board-partner duplicate
- product mapping uses only benchmark handle metafields
- compare results only resolve from exact benchmark-backed CPU/GPU handle pairs inside the active game, resolution, and preset

---

## 7. Constraints and safeguards

### 7.1 Must not break
- Add to Cart
- bundle discount logic
- quote flow
- approval flow
- existing build-link / apply logic

### 7.2 Isolation rule
The FPS Finder implementation only changes files inside the `FPS Finder` workspace and updates documentation. It does not modify PC Builder runtime files.

### 7.3 Benchmark identity rule
Do not use:
- product handles
- product titles
- benchmark entry handles

Use only:
- `custom.bench_cpu_handle`
- `custom.bench_gpu_handle`

### 7.4 Shopify pagination caution
The selected-game feed still walks a globally paginated benchmark dataset under the hood.

This is a useful intermediate serving layer because the storefront no longer downloads all benchmark rows on first load, but it is not the final generated per-game payload architecture.

### 7.5 Shopify query-string caution
The selected-game feed cannot rely on `request.params.game` for storefront query-string access.

The current implementation parses `?game=<handle>` from `content_for_header` instead. That workaround should be preserved unless the endpoint is later replaced with a generated per-game payload path that does not depend on query parsing in Liquid.

### 7.6 Unavailable part policy
Mapped products that are active but currently unavailable should still be visible in FPS Finder so shoppers can browse the full authored benchmark coverage.

The CTA disable behavior is configurable at the section level to support future merchandising changes without changing the recommendation contract.
