# PC Builder Add-On Discount Setup Guide

Use this guide when creating or updating Shopify `pc_builder_addon_discount` metaobject entries for PC Builder discounts.

Add-on discounts are extra discounts that unlock after a build meets a condition. They do not replace CPU + motherboard bundle discounts or PC Builder promos. They sit on top of the existing discount system and only apply when the discounted target item is selected in the builder.

## What This Discount Type Is For

Use `pc_builder_addon_discount` when you want to say:

- If the customer has an eligible CPU + motherboard bundle, discount selected CPU coolers.
- If the customer uses an eligible PC Builder promo, discount selected add-ons.
- If the customer has selected enough build categories, discount extra parts like GPU, case, power supply, fans, SSD, or other add-ons.

Do not use this metaobject for the base CPU + motherboard bundle price. That still belongs to `cpu_motherboard_bundle`.

Do not use this metaobject for a fixed promo link like `?promo=9800x3d-bundle`. That still belongs to `pc_builder_promo`.

## Valid PC Builder Tab Keys

Use these exact `tab` values in JSON fields:

```json
[
  "processor",
  "motherboard",
  "memory",
  "gpu",
  "ssd",
  "cpucooler",
  "case",
  "powersupply",
  "casefans",
  "other"
]
```

Common meanings:

- `processor`: CPU
- `motherboard`: motherboard
- `memory`: RAM
- `gpu`: graphics card
- `ssd`: SSD / storage
- `cpucooler`: CPU cooler
- `case`: PC case
- `powersupply`: PSU
- `casefans`: case fans
- `other`: peripherals, UPS, extras, or uncategorized add-ons

## Metaobject Fields

Create or edit entries under Shopify metaobject type:

```text
pc_builder_addon_discount
```

Recommended fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `promo_label` | Single line text | Customer-facing discount label, for example `Full Build Discount` |
| `is_active` | Boolean | Turns the rule on or off |
| `priority` | Integer | Higher priority sorts earlier when multiple rules exist |
| `unlock_on_bundle_discount` | Boolean | Unlocks when a CPU + motherboard bundle discount is active |
| `unlock_on_any_primary_promo` | Boolean | Unlocks when any valid `pc_builder_promo` is active |
| `qualifying_promo_handles` | JSON | Unlocks only for specific promo handles |
| `stack_with_bundle_discount` | Boolean | Whether this add-on can stack with bundle discount |
| `stack_with_primary_promo` | Boolean | Whether this add-on can stack with primary promo discount |
| `discounted_targets` | JSON | The products/variants that receive the add-on discount |
| `badge_label` | Single line text | Optional badge text |
| `description` | Multi-line text | Optional internal/admin description |
| `starts_at` | Date/time | Optional start date |
| `ends_at` | Date/time | Optional end date |
| `internal_note` | Multi-line text | Optional admin notes |

Bulk unlock fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `bulk_unlock_enabled` | Boolean | Unlocks this rule based on selected build categories |
| `bulk_qualifying_tabs` | JSON | Which PC Builder tabs count toward the unlock |
| `bulk_min_qualifying_tabs` | Integer | How many qualifying tabs must be selected |

## Unlock Methods

An add-on discount can unlock in one or more ways.

### 1. Unlock From CPU + Motherboard Bundle

Use this for bundle-attached add-on deals, such as CPU cooler discounts.

Recommended setup:

```text
unlock_on_bundle_discount = true
unlock_on_any_primary_promo = false
qualifying_promo_handles = []
```

### 2. Unlock From Any PC Builder Promo

Use this when any valid `pc_builder_promo` should unlock the add-on deal.

Recommended setup:

```text
unlock_on_bundle_discount = false
unlock_on_any_primary_promo = true
qualifying_promo_handles = []
```

### 3. Unlock From Specific PC Builder Promos

Use this when only selected promo links should unlock the add-on deal.

Recommended setup:

```text
unlock_on_bundle_discount = false
unlock_on_any_primary_promo = false
```

Example `qualifying_promo_handles`:

```json
[
  "9800x3d-bundle",
  "7500f-ayw-gaming-wifi-bundle"
]
```

### 4. Unlock From Bulk Build Categories

Use this when the discount should unlock after the customer selects enough build categories.

Example goal:

```text
Unlock extra discounts after CPU + motherboard + RAM + CPU cooler are selected.
```

Recommended setup:

```text
bulk_unlock_enabled = true
bulk_min_qualifying_tabs = 4
```

Example `bulk_qualifying_tabs`:

```json
[
  "processor",
  "motherboard",
  "memory",
  "cpucooler"
]
```

This counts unique selected tabs, not quantity. Selecting two RAM kits still counts as one `memory` category.

The live PC Builder totals and quote screenshots use this same rule output. If the bulk rule unlocks and a discounted target is selected, the add-on row appears in the build summary and is included in generated quote images.

## Discounted Targets JSON

`discounted_targets` controls which selected products get the discount.

Shape:

```json
[
  {
    "tab": "cpucooler",
    "product_id": "8298720854153",
    "variant_id": "",
    "qty": 1,
    "label": "Cooler Master MasterLiquid 360L Core ARGB Black",
    "discount_amount": 600
  }
]
```

Rules:

- Keep IDs as strings.
- Use either `product_id`, `variant_id`, or both.
- If discount applies to all variants of a product, use `product_id` and leave `variant_id` empty.
- If discount applies to one exact variant, include `variant_id`.
- `qty` is usually `1`.
- `label` should be readable because it can appear in discount rows, quotes, approval views, logs, and screenshots.
- `discount_amount` is the peso discount amount.

## Example: Cooler Add-On Discount

Use this when an eligible bundle or promo should unlock CPU cooler discounts.

Fields:

```text
promo_label = CPU Cooler Add-On Discount
is_active = true
unlock_on_bundle_discount = true
unlock_on_any_primary_promo = true
stack_with_bundle_discount = true
stack_with_primary_promo = true
```

`qualifying_promo_handles` can be empty if any valid promo can unlock it.

Example `discounted_targets`:

```json
[
  {
    "tab": "cpucooler",
    "product_id": "8298720854153",
    "variant_id": "",
    "qty": 1,
    "label": "Cooler Master MasterLiquid 360L Core ARGB Black",
    "discount_amount": 600
  },
  {
    "tab": "cpucooler",
    "product_id": "8311271555209",
    "variant_id": "",
    "qty": 1,
    "label": "Thermalright Peerless Assassin 120 SE",
    "discount_amount": 100
  }
]
```

## Example: Full Build Bulk Discount

Use this when you want extra discounts after a fuller build is selected.

Goal:

```text
If customer selects CPU + motherboard + RAM + CPU cooler, unlock discounts on selected GPU, PSU, case, and other parts.
```

Fields:

```text
promo_label = Full Build Discount
is_active = true
unlock_on_bundle_discount = false
unlock_on_any_primary_promo = false
stack_with_bundle_discount = true
stack_with_primary_promo = true
bulk_unlock_enabled = true
bulk_min_qualifying_tabs = 4
```

`bulk_qualifying_tabs`:

```json
[
  "processor",
  "motherboard",
  "memory",
  "cpucooler"
]
```

Example `discounted_targets`:

```json
[
  {
    "tab": "gpu",
    "product_id": "123456789",
    "variant_id": "",
    "qty": 1,
    "label": "GPU full build discount",
    "discount_amount": 1000
  },
  {
    "tab": "powersupply",
    "product_id": "987654321",
    "variant_id": "",
    "qty": 1,
    "label": "PSU full build discount",
    "discount_amount": 500
  },
  {
    "tab": "case",
    "product_id": "555555555",
    "variant_id": "",
    "qty": 1,
    "label": "Case full build discount",
    "discount_amount": 500
  }
]
```

The discount only applies when the target item is selected. If the rule unlocks but no GPU/PSU/case target is selected, there is no discount row yet.

## Setup Checklist

1. Open Shopify admin.
2. Go to the `pc_builder_addon_discount` metaobject type.
3. Create a new entry or edit an existing entry.
4. Set `is_active` to `true`.
5. Set a clear `promo_label`.
6. Choose the unlock method:
   - bundle discount
   - any promo
   - specific promo handles
   - bulk build categories
7. Fill `discounted_targets` with valid JSON.
8. Save the metaobject entry.
9. Open the PC Builder page.
10. Select the qualifying parts.
11. Select one of the discounted target products.
12. Confirm the add-on discount appears in the price cell and totals.

## Troubleshooting

If the discount does not appear:

- Confirm `is_active` is true.
- Confirm the unlock condition is met.
- Confirm the target item is selected.
- Confirm the target `tab` matches the PC Builder tab key exactly.
- Confirm `product_id` and `variant_id` are Shopify IDs, not handles.
- Confirm `discount_amount` is greater than 0.
- Confirm `discounted_targets` is valid JSON.
- Confirm date fields are blank or currently active.
- Confirm the page has the latest PC Builder files uploaded to Shopify.

If a bulk unlock does not work:

- Confirm `bulk_unlock_enabled` is true.
- Confirm `bulk_min_qualifying_tabs` is a number.
- Confirm `bulk_qualifying_tabs` is valid JSON.
- Confirm the customer selected enough unique tabs from `bulk_qualifying_tabs`.
- Remember that quantity does not count as extra tabs.

## Notes For Future Editors

- Add-on discounts are a rule layer, not a product price update.
- The discount is calculated in the PC Builder runtime.
- The same add-on discount rows are reused by totals, quote images, approval views, saved build snapshots, and Google Sheets logs.
- Keep labels customer-readable because they can appear outside the Shopify admin.
- Prefer one clear rule per campaign, for example `CPU Cooler Add-On Discount` or `Full Build Discount`.
