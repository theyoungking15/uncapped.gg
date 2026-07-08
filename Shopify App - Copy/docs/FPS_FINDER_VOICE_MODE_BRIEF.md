# FPS Finder Voice Mode Brief

## Purpose

FPS Finder is a lightweight recommendation layer that sits before the full PC Builder.

Its job is to help a shopper answer this question quickly:

"What CPU + GPU starting point should I look at for this game, this resolution, and this preset?"

It is not a full configurator. It does not build the whole PC. It only recommends benchmark-backed CPU and GPU starting points, then hands the shopper into PC Builder with those parts prefilled.

## What The Shopper Can Do

1. Pick a game.
2. Pick a supported resolution.
3. Pick a preset: `Low`, `Medium`, or `High`.
4. See curated CPU + GPU recommendation cards grouped by FPS tier.
5. Open a compare panel to test another benchmark-backed CPU + GPU pair against the current recommendation.
6. Click through to PC Builder with the recommended CPU and GPU already selected.

## What FPS Finder Actually Uses

### 1. Game index

The first request loads only enabled games and their linked recommendation profiles.

This includes:
- game name
- icon / background media
- allowed resolutions
- default preset
- tier labels
- per-resolution FPS thresholds

### 2. Selected-game benchmark feed

Once a game is selected, FPS Finder loads benchmark rows for that game only.

Each row is matched by canonical benchmark identity, not by product title.

The important fields are:
- `game_handle`
- `resolution`
- `preset`
- `cpu_bench_handle`
- `gpu_bench_handle`
- `avg`

### 3. Live CPU and GPU product feeds

FPS Finder also loads the CPU and GPU collection JSON feeds so it can map benchmark handles to real storefront products and live variant prices.

## Core Matching Rule

FPS Finder should only treat these as performance identifiers:

- `custom.bench_cpu_handle`
- `custom.bench_gpu_handle`

It should not use:

- product title
- product handle
- benchmark row title text

That rule matters because multiple storefront SKUs can share the same underlying CPU or GPU chip.

## Recommendation Logic

After the shopper picks a game, resolution, and preset, FPS Finder:

1. Filters benchmark rows to the selected game, resolution, and preset.
2. Classifies each row into the highest FPS tier it qualifies for.
3. Resolves the cheapest mapped CPU product for that CPU benchmark handle.
4. Resolves the cheapest mapped GPU product for that GPU benchmark handle.
5. Treats `game + resolution + preset + cpu_handle + gpu_handle` as one recommendation unit.
6. Ranks valid combos by:
   - lowest combined CPU + GPU starting price first
   - lowest positive FPS headroom above the tier minimum second
   - availability next
7. Shows one primary recommendation per tier.
8. Optionally shows one alternate in the same tier only if:
   - it gives at least 10% more FPS than the primary card
   - its total CPU + GPU price is not more than 35% higher

## Tier Behavior

Tier logic is ascending:

- `tier_1` = lowest valid experience band
- `tier_2` = middle band
- `tier_3` = highest band

A stronger combo only appears in the highest tier whose minimum FPS it clears. It does not repeat in lower tiers.

## Compare Mode

Each recommendation card can open a compare panel.

The compare panel:
- keeps the current game, resolution, and preset fixed
- uses the clicked recommendation as the baseline
- lets the shopper choose another benchmark-backed CPU and GPU handle
- only shows a comparison if an exact benchmark row exists for that pair
- shows:
  - FPS delta
  - price delta
  - tier shift

If game, resolution, or preset changes, the compare state resets.

## PC Builder Handoff

FPS Finder does not create quote codes and does not own approval flow.

It simply sends the shopper to PC Builder using a stateless URL like:

`builder_page_url?cpu=<cpuVariantId>&gpu=<gpuVariantId>`

That means FPS Finder only preselects CPU and GPU. The rest of the build still happens in PC Builder.

## Availability Behavior

Unavailable mapped parts can still appear in FPS Finder so shoppers can browse the full benchmark coverage.

There is a section setting that can disable the CTA when mapped parts are unavailable, but by default the recommendation card can still be shown.

## What Voice Mode Should Say

Voice mode should describe FPS Finder as:

- a starting-point recommender
- benchmark-backed
- game / resolution / preset driven
- focused on CPU + GPU only
- a handoff into PC Builder, not a replacement for PC Builder

Voice mode can say:

- "Pick a game and I’ll show you benchmark-backed CPU and GPU starting points."
- "These results are grouped by FPS tier based on the thresholds authored for that game profile."
- "When you click a result, PC Builder opens with the CPU and GPU already selected."
- "You can compare another CPU and GPU benchmark pair without leaving FPS Finder."

Voice mode should not say:

- "This builds the full PC for you."
- "These are exact real-time final system prices."
- "Any CPU can be compared with any GPU even without benchmark data."
- "Product titles are the performance identity."

## Recommended Voice Assistant Framing

Use this as the grounding summary for website voice mode:

```md
You are the voice assistant for Uncapped PC's FPS Finder.

FPS Finder is a benchmark-backed recommendation tool that helps shoppers find a CPU + GPU starting point for a selected game, resolution, and preset.

The shopper can choose:
- game
- resolution
- preset

FPS Finder then:
- filters benchmark rows for that game, resolution, and preset
- maps the benchmark CPU and GPU handles to live storefront products
- groups results into authored FPS tiers
- shows one main recommendation per tier, plus one alternate only when it offers materially higher FPS without a disproportionate price jump

FPS Finder is not a full PC configurator.
It only recommends CPU and GPU starting points.
The full build still happens in PC Builder.

When the shopper clicks a recommendation, PC Builder opens with the CPU and GPU prefilled through URL params.

Do not invent unsupported games, resolutions, presets, or benchmark results.
Do not describe product titles or product handles as the performance identity.
Use benchmark-backed CPU and GPU handle mapping as the source of truth.
```

## Storefront Files

Main files for the live implementation:

- `FPS Finder/sections/ucp-fps-finder.liquid`
- `FPS Finder/assets/ucp-fps-finder.js`
- `FPS Finder/assets/ucp-fps-finder.css`
- `FPS Finder/templates/page.ucp-fps-finder-json.liquid`
- `FPS Finder/templates/page.ucp-fps-finder-game-json.liquid`

## Short Version

If you need the shortest possible voice-mode description:

> FPS Finder helps shoppers choose a game, resolution, and preset, then shows curated benchmark-backed CPU and GPU starting points grouped by FPS tier. It is not a full configurator. It hands the shopper into PC Builder with CPU and GPU preselected.
