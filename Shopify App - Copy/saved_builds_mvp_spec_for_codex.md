# Saved Builds MVP Spec for Codex

## Role
You are working inside the existing Uncapped PC Shopify workspace.

Assume the surrounding project context already exists and has already been reviewed.
Do not rebuild unrelated systems.
Do not rewrite working flows unless needed.
Keep changes minimal, reversible, and maintainable.

This task is specifically about **Priority 1** and **Priority 2**:

1. **Saved Builds data model and account linkage**
2. **My Builds customer account page**

---

## Goal
Build the first version of a **customer-owned Saved Builds system** for Uncapped PC.

A logged-in customer should be able to:
- save multiple PC builds to their account
- view their saved builds in a customer account page
- reopen a saved build in the PC Builder
- share a saved build with other people
- keep the foundation clean for future attribution, quote history, upgrade workflows, and possible public/community features later

This is an **MVP foundation task**.
Do not try to build comments, social feeds, or full community features yet.

---

## Product Intent
This feature is not just "save a build."
It is the foundation for:
- persistent customer-owned PC builds
- repeat builder usage
- account-centered workflow history
- future share attribution
- future quote linkage
- future upgrade guidance tied to owned or saved builds

The saved build should become an **account asset**.

---

## Scope for This Task

### In Scope
- logged-in customer can save multiple builds
- each saved build is tied to the Shopify customer identity
- each saved build has a stable internal record
- customer can view a list of their saved builds
- customer can reopen a build in the builder
- customer can share a build via link
- basic account completeness thinking should be respected where relevant
- architecture should support future expansion

### Out of Scope for This MVP
- comments
- photo attachments for saved builds
- public build profiles
- build likes or reactions
- public community feed
- advanced referral rewards
- transaction/reputation system
- full quote history UI unless already trivial to expose

If something extra is needed for the architecture, add only what is necessary.

---

## Key Product Rules

### 1. Ownership must be customer-ID based
Do **not** use username or handle as the real ownership key.
Use the Shopify customer ID as the primary owner reference.

A username or public handle can be added later as a public/share layer.

### 2. Multiple builds per customer
One customer account must be able to save multiple builds.
This is a hard requirement.

### 3. Share links should work now, attribution can be extended later
The MVP should support a shareable build link.

If the existing builder already has quote/share link patterns, reuse them where sensible.
Do not create a second conflicting link system unless necessary.

The architecture should leave room for future parameters like `src`, but do not overbuild attribution tracking in this phase.

### 4. Minimize disruption to the existing PC Builder
Do not break current builder behavior.
Add saved-build capability around the current builder flow as cleanly as possible.

### 5. Think long-term in the data model
Even if the UI is simple, the stored record structure should support later:
- quote linking
- saved build history
- upgrade recommendation history
- future account pages
- future ownership visibility

---

## Required Deliverables
Codex should produce the implementation and also explain the final architecture.

### Deliverable A. Implementation
Implement the Saved Builds MVP in the Shopify workspace.

### Deliverable B. Architecture Explanation
Create or update a markdown document explaining:
- what was added
- file structure
- data model
- how saved builds work
- how account ownership is enforced
- how reopening and sharing work
- what future extension points were intentionally left in place

### Deliverable C. Changelog
Create or update a changelog markdown file for this task.

### Deliverable D. Testing Checklist
Create a practical test checklist for merchant testing.

---

## Technical Expectations

### Preferred implementation mindset
- Shopify OS 2.0 compatible
- minimal, targeted changes
- reuse existing builder patterns where possible
- do not hardcode fragile assumptions
- do not create duplicate logic if builder state/quote state already exists somewhere useful
- keep code understandable for future maintenance

### Protect existing logic
- preserve existing builder selection logic
- preserve existing quote generation flow unless modification is required
- preserve current approval/reopen behavior unless explicitly part of the saved-build workflow

### Code output expectations
When changing files:
- provide full updated files
- label file paths clearly
- explain purpose of each file
- do not provide partial snippets unless absolutely unavoidable

---

## Recommended MVP Architecture

### A. Saved Build record
Create a saved build record structure that includes at minimum:

- internal saved build ID
- Shopify customer ID
- customer email snapshot
- customer name snapshot if available
- build name
- build payload/state needed to reopen the builder
- optional quote code if relevant to current builder logic
- created at timestamp
- updated at timestamp
- status or visibility field if needed for future use

If the current workspace already has a data shape close to this, extend it instead of inventing a parallel system.

### B. Builder save action
Inside the PC Builder flow, add a save action for logged-in customers.

Expected behavior:
- if user is not logged in, handle gracefully
- if user is logged in, they can save the current build
- allow creating more than one saved build
- support naming the build, even if the first version uses a simple default naming pattern like "My Build" or timestamp-based fallback

### C. My Builds account page
Add a customer account page that shows the logged-in user's saved builds.

Minimum actions per saved build:
- view/list build name
- last updated or created date
- reopen in builder
- share build link
- delete build if appropriate

Optional if easy and clean:
- duplicate build
- rename build

Do not let optional polish delay the core implementation.

### D. Reopen flow
A saved build must be able to reopen into the builder with the correct state restored.

If the builder already supports share/reopen via URL state, quote code, or internal payload, reuse that pattern where appropriate.

### E. Share flow
Each saved build should have a shareable URL.

For this MVP, the share link must at least:
- open the saved build or equivalent builder state
- be stable enough for customer use

Future attribution like `src=username` should be accounted for in architecture, but not overbuilt now.

---

## Data Model Guidance
Use the cleanest realistic data structure available in the current workspace.

Codex should first inspect what the existing builder and quote systems already use.
Then choose the least disruptive storage model.

Possible options may include:
- Shopify customer metafields
- metaobjects tied indirectly to customer identity
- app-side storage already used in the workspace
- existing external/storefront support layers if already present

### Important instruction
Do **not** choose a storage model just because it is fast to code.
Choose one that is maintainable and realistic for:
- multiple records per customer
- later querying for account pages
- later linkage to quotes or other workflows

If there is a tradeoff, explain it clearly.

---

## Customer Account Foundation Thinking
This task is not the full customer account system, but it must help establish it.

The implementation should respect these long-term account principles:
- important customer actions should belong to a real account
- stored records should keep customer snapshots when useful
- account pages should become the home for build and workflow history
- future features like listings, quotes, and support history should be able to follow the same ownership model

If some small reusable identity helper or account completeness helper is needed, add it only if it improves consistency.

---

## Builder Catalog Control
As a forward-looking note, keep in mind that the builder may later need a product visibility control such as a builder eligibility toggle.

This is not the main task here unless the current implementation requires touching it.
Do not let this expand the scope unnecessarily.

---

## UX Requirements

### Save Build UX
The UX should be simple and clear.
Examples:
- Save Build button inside builder
- feedback message on successful save
- graceful handling if login is required

### My Builds UX
The page should be functional before it is pretty.
Prioritize:
- clarity
- account ownership
- easy reopen action
- easy share action

### Mobile
Do not ignore mobile usability.
The page must remain usable on mobile.

---

## Suggested Build Order

### Phase 1
Inspect the current builder architecture and identify:
- how build state is represented
- how quote/share links currently work
- what storage or identity infrastructure already exists

### Phase 2
Design the saved-build record model and choose storage.

### Phase 3
Implement save action in the builder.

### Phase 4
Implement My Builds customer account page.

### Phase 5
Implement reopen and share behavior.

### Phase 6
Write architecture notes, changelog, and testing checklist.

---

## Questions Codex Must Answer During Implementation
Before finalizing, Codex should explicitly answer these:

1. Where is the saved build stored?
2. Why was that storage model chosen?
3. How is customer ownership enforced?
4. How is multiple-build support handled?
5. How does reopen work?
6. How does share work?
7. What future account or attribution features does this architecture support?
8. What limitations remain in this MVP?

---

## Testing Checklist Requirements
The test checklist should cover at minimum:
- logged-in user can save a build
- one user can save multiple builds
- saved builds appear only in the correct customer account
- reopen restores the expected build state
- share link opens successfully
- delete works safely if implemented
- guest behavior is handled correctly
- no major builder flow regressions
- mobile usability is acceptable

---

## Final Instruction to Codex
Do not treat this as a UI-only task.
Treat it as the first real layer of an **account-centered Uncapped PC system**.

Build the MVP narrowly, but design the foundation cleanly.

The target outcome is:
- customers can save and manage their builds
- builds belong to real customer accounts
- builds can be reopened and shared
- the store moves one step closer to a unified account system

Keep it practical.
Keep it maintainable.
Keep it compatible with the current workspace.

