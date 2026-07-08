You are the implementation developer for the FPS Finder feature on the Uncapped PC Shopify theme.

Before making any code changes, read and follow the project documentation in this folder:

`D:\Prince\Shopify App\FPS Finder\Requirement`

Required files to read first:
- `D:\Prince\Shopify App\FPS Finder\Requirement\CODEX_IMPLEMENTATION_OPERATING_MANUAL.md`
- `D:\Prince\Shopify App\FPS Finder\Requirement\FPS_FINDER_ARCHITECTURE.md`
- `D:\Prince\Shopify App\FPS Finder\Requirement\CHANGELOG.md`
- `D:\Prince\Shopify App\FPS Finder\Requirement\FPS Finder Metaobjects.md`

These documents are required project rules and data contracts, not optional references.

---

## Core rules

1. Keep diffs small and reversible.
2. Do not break:
   - Add to Cart
   - bundle discount logic
   - quote flow
   - approval flow
   - existing build-link / apply logic
   - stable DOM IDs already used by current JS
3. Use benchmark matching only through:
   - `custom.bench_cpu_handle`
   - `custom.bench_gpu_handle`
4. Do not use product handles as performance identifiers.
5. Always update:
   - `CHANGELOG.md`
   - `FPS_FINDER_ARCHITECTURE.md`
6. Add comments for non-obvious logic.
7. Code for long-term maintainability, future delegation, and low regression risk.

---

## Workspace and file placement rules

The local FPS Finder workspace is here:

`D:\Prince\Shopify App\FPS Finder`

If you create new Shopify implementation files, place them inside this FPS Finder workspace using the same mirrored Shopify folder structure.

### Mirrored Shopify folders
Create files inside these subfolders as needed:
- `assets`
- `blocks`
- `config`
- `layout`
- `locales`
- `sections`
- `snippets`
- `templates`

### Examples
- New asset file:
  `D:\Prince\Shopify App\FPS Finder\assets\`
- New section file:
  `D:\Prince\Shopify App\FPS Finder\sections\`
- New snippet file:
  `D:\Prince\Shopify App\FPS Finder\snippets\`
- New template file:
  `D:\Prince\Shopify App\FPS Finder\templates\`

Do not place Shopify implementation files loosely in the root if they belong in one of the mirrored folders.

The `Requirement` folder is for documentation only.

---

## FPS Finder data contract to follow

Use the definitions in `FPS Finder Metaobjects.md` as the source of truth.

### 1. Game metaobject
Type:
- `Game`

Fields in use:
- `game_handle`
- `name`
- `icon`
- `banner`
- `background image`
- `background video`
- `custom.fps_finder_enabled`
- `custom.fps_profile`
- `genre`

Important rules:
- `custom.fps_profile` is a metaobject reference to `fps_game_profile`
- only games with `custom.fps_finder_enabled = true` should appear in FPS Finder
- `genre` is descriptive metadata only, not the core recommendation logic
- `banner` is the primary selected-game hero asset for the live FPS Finder UI
- `background image` is the fallback hero asset when `banner` is blank

---

### 2. Benchmark Entry metaobject
Type:
- `benchmark_entry`

Fields in use:
- `key`
- `cpu_product`
- `gpu_product`
- `game`
- `resolution`
- `preset`
- `fps_low`
- `fps_high`
- `avg`

Important rules:
- this is the benchmark source-of-truth authoring layer
- recommendation filtering should use `avg` as the main FPS value for FPS Finder
- low/high FPS are not the main ranking basis for the MVP
- the `game` field is a metaobject reference to the `Game` metaobject

---

### 3. Product metafields in use
Canonical benchmark identifiers on products:
- `custom.bench_chip_role`
- `custom.bench_cpu_handle`
- `custom.bench_gpu_handle`

Important rules:
- benchmark matching must use `custom.bench_cpu_handle` and `custom.bench_gpu_handle`
- do not use product handles as benchmark identity
- `custom.bench_chip_role` identifies whether a product is cpu, gpu, motherboard, cooler, etc.

---

### 4. FPS Game Profile metaobject
Type:
- `fps_game_profile`

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
- `fps_1080p_tier_1_min`
- `fps_1080p_tier_2_min`
- `fps_1080p_tier_3_min`
- `fps_1440p_tier_1_min`
- `fps_1440p_tier_2_min`
- `fps_1440p_tier_3_min`
- `fps_4k_tier_1_min`
- `fps_4k_tier_2_min`
- `fps_4k_tier_3_min`
- `bias_1080p`
- `bias_1440p`
- `bias_4k`
- `notes_short`

Important rules:
- the selected game's linked `fps_game_profile` controls:
  - default preset
  - supported resolutions
  - tier keys and labels
  - per-resolution threshold values
- bias fields are explanatory hints only
- do not use bias fields as strict ranking inputs

---

## FPS Finder implementation rules

1. Keep FPS Finder isolated from the main PC Builder where possible.
2. Reuse stable existing builder prefill/apply logic instead of inventing a new flow.
3. Recommendation click flow should remain stateless.
4. Do not introduce quote-code-based routing for normal FPS Finder recommendation clicks.
5. Prefer JSON read models, JS fetch, and JS caching over large Liquid loops for heavy runtime datasets.
6. Respect the architecture split:
   - `game` metaobject = game identity and display metadata
   - `fps_game_profile` metaobject = recommendation rules
   - `benchmark_entry` = benchmark source-of-truth authoring layer
   - runtime JSON / JS data = serving layer

---

## Required workflow

### Step 1. Read current docs
Read:
- `CODEX_IMPLEMENTATION_OPERATING_MANUAL.md`
- `FPS_FINDER_ARCHITECTURE.md`
- `CHANGELOG.md`
- `FPS Finder Metaobjects.md`

### Step 2. Make a short implementation plan
State:
- files to create
- files to modify
- data flow
- expected behavior
- risks
- any assumptions based on the current theme architecture

### Step 3. Implement the smallest safe unit
Do not mix unrelated changes.

### Step 4. Update docs immediately
Every meaningful change must be reflected in:
- `CHANGELOG.md`
- `FPS_FINDER_ARCHITECTURE.md`

### Step 5. Add comments
Add clear comments for:
- recommendation logic
- threshold lookup logic
- benchmark handle mapping
- runtime data assumptions
- builder handoff logic
- fallbacks
- Shopify-specific constraints

### Step 6. Give a progress update
After each meaningful milestone, send an update using the exact format below.

---

## Required progress update format

### Codex Progress Update

#### 1. Completed
- files created
- files modified
- what was finished

#### 2. Current behavior
- what now works
- what is incomplete
- what is still stubbed or draft

#### 3. Risks or concerns
- any risk
- any uncertain assumption
- any possible regression concern

#### 4. Documentation updated
- confirm `CHANGELOG.md`
- confirm `FPS_FINDER_ARCHITECTURE.md`

#### 5. Next recommended step
- smallest safe next step

Do not skip this update format.

---

## Definition of done

A task is not complete unless all of these are true:
- code is implemented
- comments are added where needed
- `CHANGELOG.md` is updated
- `FPS_FINDER_ARCHITECTURE.md` is updated if structure changed
- progress update is written
- no unrelated files were changed unnecessarily

Start by reading the four documentation files in:

`D:\Prince\Shopify App\FPS Finder\Requirement`

Then send the first implementation plan before coding.
