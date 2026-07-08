# FPS Finder Change Brief
## Add recommendation layer above tier sections
## Update Best Value logic to use FPS per peso

This document describes the next FPS Finder update.

The goal is to improve decision-making for shoppers without breaking the current FPS Finder architecture, benchmark logic, or PC Builder handoff.

---

## 1. Goal

Add a new recommendation layer near the top of the FPS Finder results so shoppers can decide faster.

Instead of forcing the shopper to browse the tier sections first, FPS Finder should show a small set of higher-level recommendation cards above the current tier sections.

These top cards should help answer:
- what is the best value option
- what is the better long-term option
- what should I click first if I want a stronger starting point

This must be implemented safely and must not break:
- current benchmark matching
- current result generation
- current compare behavior unless changes are explicitly required
- current PC Builder handoff
- current Add to Cart, quote, approval, and bundle logic outside FPS Finder

---

## 2. Current behavior

Current FPS Finder behavior:
- shopper selects game
- shopper selects resolution
- shopper selects preset
- FPS Finder loads benchmark-backed CPU + GPU recommendations
- recommendations are grouped into tier sections
- shopper can compare supported benchmark-backed combinations
- shopper can open PC Builder with CPU and GPU prefilled

Current issue:
- the page is logically correct, but it does not guide the shopper quickly enough
- tier sections are useful for exploration, but they are not the best top-of-page buying aid
- the current page feels more like a benchmark browser than a buying guide

---

## 3. New behavior required

Add a top recommendation layer above the current tier sections.

At minimum, this layer should surface these 3 cards:

1. Best Starting Point
2. Best Value
3. Better Upgrade Path

These should appear after the game / resolution / preset controls and before the current tier sections.

The existing tier sections should remain, but they should become secondary exploration content.

The recommendation layer must be driven by existing benchmark-backed results and live mapped product data.
Do not invent unsupported combinations.

---

## 4. Meaning of each top recommendation

### 4.1 Best Value
Definition:
- the best value combo among valid mapped CPU + GPU results
- Best Value must now be based primarily on FPS per peso, not simply lowest total cost
- this should help answer: "Which valid combo gives the most FPS for the money spent?"

Important:
- only benchmark-backed and valid mapped combos may be considered
- do not choose a combo that does not qualify for the relevant result context just because it is cheap

### 4.2 Better Upgrade Path
Definition:
- a valid mapped CPU + GPU combo that is more future-friendly than the best value option
- this should prefer CPUs on the newer platform where appropriate
- for current platform detection, use the existing CPU processor socket data if available
- if AM5 and AM4 both qualify, this lane should prefer AM5 when it is a sensible step up

Important:
- do not create new platform metaobjects for this
- use the existing CPU socket / processor socket data already available in the catalog if present and already trusted by the builder/product data layer

### 4.3 Best Starting Point
Definition:
- a configurable stronger recommendation that sits above pure value
- it should be derived from the valid benchmark-backed result set
- it should not simply duplicate Best Value unless no better candidate qualifies
- it should aim to represent a more practical first-click recommendation for shoppers

This card must be configurable by rule, not hardcoded manually per game.

---

## 5. Best Value logic must use FPS per peso

### 5.1 Formula
Best Value should use this formula:

`fps_per_peso = avg_fps / total_cpu_gpu_starting_price`

Where:
- `avg_fps` = benchmark average FPS for the exact selected game / resolution / preset / cpu_handle / gpu_handle row
- `total_cpu_gpu_starting_price` = mapped CPU starting price + mapped GPU starting price

### 5.2 Best Value selection rule
Among the valid mapped recommendation candidates for the current selected context:
- rank first by highest FPS per peso
- use lower total price as the next tie-break
- use higher FPS as the next tie-break
- use availability next

This means Best Value is no longer simply the cheapest qualifying combo.
It is the combo that gives the best benchmark-backed FPS return for the money.

### 5.3 Important notes
- this metric is only meaningful if mapped CPU and GPU prices are valid
- if price data is missing or invalid, the combo cannot be used for Best Value
- document this formula clearly in code comments and architecture docs

---

## 6. Main recommendation logic must be configurable

The Best Starting Point logic must be configurable.

Create configuration inputs for at least these two thresholds:

### 6.1 Minimum FPS improvement over Best Value
Default:
- 10 percent

Meaning:
- the Best Starting Point candidate should ideally provide at least 10 percent more FPS than Best Value

### 6.2 Maximum allowed price increase over Best Value
Default:
- 20 percent

Meaning:
- the Best Starting Point candidate should ideally not cost more than 20 percent above the Best Value combo total CPU + GPU starting price

These values must be easy to change later without rewriting the main recommendation algorithm.

Preferred implementation:
- section settings if practical
- otherwise a clearly documented config object in the FPS Finder section or JS config
- do not bury these as unexplained magic numbers in the algorithm

---

## 7. Recommended Best Starting Point selection logic

Use this logic unless implementation constraints require a safer equivalent.

### Step A
Start from the valid mapped results for the selected game / resolution / preset.

### Step B
Resolve Best Value first using FPS per peso:
- highest FPS per peso first
- lower price as tie-break
- higher FPS next
- availability next

### Step C
Search for a Best Starting Point candidate:
- must be a valid mapped combo
- must have FPS >= Best Value FPS * configurable minimum improvement factor
- must have total price <= Best Value total price * configurable maximum price factor

Default factors:
- FPS improvement factor = 1.10
- max price factor = 1.20

### Step D
If multiple candidates qualify:
rank by:
1. lowest price among qualifying candidates
2. higher FPS second
3. availability next
4. platform desirability only after the above, if needed

### Step E
If no candidate qualifies:
- fall back to Best Value
- but label / note should make sense and not imply a distinct step-up exists when it does not

Important:
- this logic must be documented in comments
- thresholds must be configurable
- no hidden hardcoded assumptions

---

## 8. Better Upgrade Path logic

Preferred behavior:
- choose a valid combo that qualifies and offers a more future-friendly CPU platform than Best Value when possible
- prefer AM5 over AM4 if:
  - the combo is valid
  - mapped products exist
  - the price step-up is not absurdly disproportionate
- if no better platform path exists, fall back to the strongest sensible alternate and label it appropriately

Important:
- do not fake AM5 if only AM4 is valid for the current result set
- use existing CPU socket / processor socket data if already present
- expose the platform label in the UI if the data is available and reliable

---

## 9. UI changes required

### 9.1 Add a new top recommendation row
Place this between:
- the current controls area
- and the current tier sections

### 9.2 New top card labels
Use:
- Best Starting Point
- Best Value
- Better Upgrade Path

### 9.3 Card contents
Each top recommendation card should include:
- title label
- average FPS
- CPU + GPU starting price
- CPU name
- GPU name
- stock / availability summary if reliable
- platform label if available and reliable, for example AM4 or AM5
- CTA into PC Builder using current stateless handoff
- short rationale text

### 9.4 Rationale text examples
Examples only. Actual wording can be adjusted:
- Best Value: Best FPS-per-peso benchmark-backed starting point
- Best Starting Point: Better first recommendation with more FPS headroom for a modest price step-up
- Better Upgrade Path: Stronger long-term platform option with more upgrade room

### 9.5 Tier sections stay below
Do not remove the tier sections.
Keep them below the new recommendation row.

### 9.6 Tighten the tier section layout
Reduce excessive empty vertical space where practical.
If a tier has only one card, do not render oversized dead space around it.

---

## 10. Availability behavior

Current unavailable or broken-feeling CTA states should be reviewed.

Goal:
- recommendation cards should not feel broken
- if mapped products exist but are unavailable, the UI should communicate that clearly
- if Builder handoff cannot be created, do not present it as a normal active primary path

Do not change this recklessly.
If current availability handling is tied to other stable logic, preserve behavior first and improve messaging safely.

---

## 11. Compare behavior

Do not remove compare mode unless necessary.

But compare mode should remain secondary.
The new recommendation layer is the primary addition.

If compare UI currently takes too much space, reduce its visual dominance only if this can be done safely without destabilizing behavior.

Do not perform a broad compare refactor in this task unless necessary.

---

## 12. Data and logic constraints

### Keep using these as performance identifiers
- `custom.bench_cpu_handle`
- `custom.bench_gpu_handle`

### Do not use these as performance identifiers
- product handles
- product titles
- freeform benchmark titles

### Benchmark source
- continue using benchmark-backed combinations only
- do not invent unsupported comparisons or unsupported result cards

### Platform detection
- use existing CPU processor socket / socket data if already available in the product data layer
- do not introduce a new platform metaobject for this task

### Price source
- Best Value and Best Starting Point logic depend on live mapped CPU + GPU price data
- if price data is missing or malformed, the combo cannot be ranked correctly for those lanes
- handle this safely and document the fallback

---

## 13. Files likely involved

Exact file list depends on current implementation, but likely includes:
- FPS Finder section file
- FPS Finder JS asset
- FPS Finder CSS asset if layout changes are needed
- any JSON template or runtime feed files if the new layer requires extra resolved fields
- docs:
  - `CHANGELOG.md`
  - `FPS_FINDER_ARCHITECTURE.md`

Codex must inspect current file usage first before editing.

---

## 14. Documentation requirements

Codex must:
- update `CHANGELOG.md`
- update `FPS_FINDER_ARCHITECTURE.md`
- add clear inline comments for the new recommendation logic
- document the configurable thresholds
- document the FPS-per-peso formula
- explain fallback behavior for Best Starting Point
- explain fallback behavior when price data is missing

---

## 15. Required implementation plan before coding

Before writing code, Codex must provide:
1. files to create
2. files to modify
3. how the current result set is being reused
4. where the configurable thresholds will live
5. how processor socket / platform will be resolved
6. how FPS per peso will be calculated
7. any regression risks

No coding should begin before that short plan is written.

---

## 16. Acceptance criteria

This task is complete only when all of the following are true:

- a new recommendation row appears above the tier sections
- the row includes:
  - Best Starting Point
  - Best Value
  - Better Upgrade Path
- the top cards are benchmark-backed and map to live products
- Best Value uses FPS per peso as its primary ranking rule
- Best Starting Point uses configurable thresholds
- default thresholds exist for:
  - minimum FPS improvement over Best Value
  - maximum price increase over Best Value
- tier sections still work below the top row
- PC Builder handoff still works
- existing FPS Finder benchmark matching still uses canonical bench handles
- no unrelated PC Builder behavior is broken
- docs are updated
- code comments are added for non-obvious logic

---

## 17. Non-goals for this task

Do not include these unless necessary:
- broad redesign of FPS Finder
- full compare mode redesign
- replacing the whole tier system
- quote-code routing
- changing benchmark identity rules
- inventing unsupported benchmark combinations
- creating new platform metaobjects
- expanding into full build recommendation beyond CPU + GPU

---

## 18. Notes for future follow-up

This task should make the Best Starting Point configurable, but it does not need to perfect the formula forever.

Future tuning may change:
- FPS improvement threshold
- price increase threshold
- platform weighting
- availability weighting
- smarter game-specific recommendation formulas
- whether Best Value should include additional guards beyond pure FPS per peso

For now, the key requirement is:
- top recommendation layer exists
- logic is explainable
- thresholds are configurable
- Best Value uses FPS per peso
- implementation is safe