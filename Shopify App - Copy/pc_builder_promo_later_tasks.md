# PC Builder Promo. Later Tasks and Implementation Notes

## Purpose
This document lists the next set of tasks for the PC Builder promo flow, bundle discoverability, bundle modal behavior, URL parameter behavior, and dev-only screenshot tooling on the bundles page.

---

## 1. Make the promo discoverable inside the PC Builder

### Goal
If the customer selects the exact components required for a bundle promo, the builder should automatically recognize that the build qualifies and apply the promo discount.

### Tasks
- Define the promo matching logic.
  - Exact product match only.
  - Exact variant match if required.
  - Required quantity rules.
- Detect when the current build matches a specific promo.
- Automatically apply the promo discount once the build qualifies.
- Show clear UI feedback that the promo is active.
- Show which selected components are satisfying the promo.
- Show which required component is still missing when the promo is incomplete.
- Remove the promo cleanly if the customer changes the build and it no longer qualifies.

### Validation
- Promo applies only when the full requirement is met.
- Promo disappears immediately if the build becomes invalid.
- No duplicate or stacked discounting unless explicitly supported.
- Promo logic does not conflict with any other active promo.

---

## 2. Check how promo logic affects the URL param system

### Goal
Ensure that promo discoverability works correctly with shared links, promo links, and existing URL param behavior.

### Tasks
- Decide the source of truth for promo state.
  - Does the URL param force a promo context?
  - Or does the build itself determine eligibility? (this should be the source of truth, Because I know that for now what we are currently doing Is that we're forcing params in order for us to promote the the bundle but correct me if I'm wrong)
- Test the following cases:
  - User enters the builder with a promo URL param, then changes parts.
  - User opens a shared build link that already qualifies for a promo.
  - User opens a promo link but the required parts are not currently selected.
  - User changes from one promo-qualified build to another.
- Decide whether the URL param should be:
  - informational only,
  - an initial promo context,
  - or a forced promo filter. (I think this one is the best one but correct me if I'm wrong)

### Validation
- URL param must not create fake discounts.
- Shared build links must remain stable and predictable.
- Promo state in the UI must always match actual eligibility.

### Important Note
This needs to be defined clearly. If promo behavior and URL behavior are not aligned, the builder will feel inconsistent and hard to trust.

---

## 3. Create a modal for the specific bundle promo 

### Goal
Show the customer a clear and useful bundle modal when a promo is available or relevant.

### Tasks
- Create a modal that can show: 
  - Bundle name.
  - Included components.
  - Discount or bundle price.
  - Why the bundle is relevant.
  - CTA such as `Apply Bundle`, `View Bundle`, or similar.
- Decide how the modal should be triggered.
  - Auto-open once.
  - Open only when the bundle becomes eligible.
  - Open from a banner or button.
- Decide whether the modal is:
  - informational only,
  - or interactive and able to swap parts into the current build.

### Validation
- Modal should not interrupt the user too aggressively.
- It must be clear what happens when the user accepts or closes it. (Probably if we enable this right what could happen There should be CTA that say add to build) (its kind of like how the onboarding works)
- It must work well on mobile.

### Recommendation
Do not prioritize modal behavior before the bundle matching logic is stable. The logic comes first. The modal is only the presentation layer.

---

## 4. Add dev-only functionality on the bundles page

### Goal
Enable hidden developer tools on the bundles page through a URL param such as `?dev=1`.

### Tasks
- Detect `dev=1` on the bundles page.
- If present, reveal dev-only controls.
- Add a screenshot generation button.
- Keep this hidden for all normal users.
- Decide whether screenshot generation is:
  - per bundle card,
  - or available for all bundles at once.

### Validation
- `?dev=1` must not change pricing or customer-facing logic.
- Dev tools must not appear for regular visitors.
- The implementation should be isolated and reversible.

---

## 5. Create screenshot generation for bundle cards

### Goal
Allow dev mode to generate a screenshot based on the current displayed bundle price and visible bundle content.

### Tasks
- Decide what the screenshot should include:
  - Bundle title. /
  - Included components. /
  - Current displayed price. /
  - Discount label if applicable. /
  - Branding or page styling if needed. /
- Decide whether screenshot generation should use:
  - live DOM capture,
  - or a separate screenshot-specific layout. probably different
- Add a dev-only button to trigger screenshot generation.
- Ensure the price used in the screenshot is the current computed price, not stale hardcoded content.

### Validation
- Screenshot output must match what is shown in the UI. (probably not this one because we  want a different layout)
- Layout should remain clean and readable.
- Output should be usable for posting or internal review.

### Recommendation
A dedicated screenshot layout may be more reliable than capturing a raw live card if the live card has too many dynamic or inconsistent UI elements.

---

## Recommended implementation order

1. Build promo matching engine.
2. Apply promo discount automatically.
3. Define promo and URL param behavior.
4. Add promo state feedback in the builder UI.
5. Build the promo modal.
6. Add `?dev=1` support on the bundles page.
7. Add screenshot generation button.
8. Polish screenshot-specific layout if needed.

---

## Critical decisions to lock before implementation

- What exactly qualifies a bundle promo? (We do have different promos right there are CPU and motherboard bundles and the specific promo that we have created recently So the recent promo that is created there is a that there is a rule that overlaps with the bundle and the one that does not, We are not going to change any of how the promo works right now we're just going to make sure that it needs to be seen or probably it auto the prom gets auto discovered when all of the components are included)
- Can multiple promos exist at the same time? (we haven't encountered this yet. Probably in the future we're going to add applicable with other promos as a meta object)
- Does the URL param force a promo context, or only suggest one? (not sure what this means)
- Is the bundle price fixed, or computed from live component prices minus a discount?
- Should the modal apply changes automatically, or only inform the user?
- Should screenshot output reflect only live page pricing?

---

## Working checklist

- [ ] Build promo matching logic.
- [ ] Auto-apply promo discount.
- [ ] Remove promo when build becomes invalid.
- [ ] Add UI feedback for active promo.
- [ ] Define promo and URL param interaction.
- [ ] Test shared links and promo links.
- [ ] Build bundle modal.
- [ ] Add `?dev=1` detection on bundles page.
- [ ] Show hidden dev controls.
- [ ] Add screenshot button.
- [ ] Generate screenshot from current displayed bundle data.
- [ ] Polish screenshot layout.

---

## Main risk
The biggest risk is not the screenshot feature. The biggest risk is unclear promo logic and unclear URL behavior. If those are not defined properly, the rest of the experience will become inconsistent and harder to maintain.
