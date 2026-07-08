# PC Builder Promo JSON ChatGPT Prompt

Use this when you want ChatGPT to generate the JSON for the `required_components` field of your Shopify `pc_builder_promo` metaobject.

## Recommended Prompt

```text
You are helping me build the JSON for the `required_components` field of a Shopify `pc_builder_promo` metaobject.

Return valid JSON only.
Do not explain anything.
Do not use markdown fences.
Output must be a JSON array.

Use this exact shape for every item:
{
  "tab": "...",
  "product_id": "...",
  "variant_id": "...",
  "qty": 1,
  "label": "..."
}

Rules:
- Keep all IDs as strings.
- Always include all 5 keys: `tab`, `product_id`, `variant_id`, `qty`, `label`.
- If I only provide `product_id`, set `variant_id` to "".
- If I only provide `variant_id`, set `product_id` to "" unless I also provided a product ID.
- Default `qty` to 1 unless I explicitly give another quantity.
- Preserve the item name exactly in `label`.
- Do not rename keys.
- Do not add extra keys.

Valid `tab` values are only:
- "processor"
- "motherboard"
- "memory"
- "gpu"
- "cpucooler"
- "ssd"
- "powersupply"
- "case"
- "casefans"
- "other"

Infer the correct `tab` from the item name using these rules:
- CPU, Ryzen, Intel Core, processor = "processor"
- Motherboard, B650, B850, X670, Z790 = "motherboard"
- RAM, DDR4, DDR5, memory = "memory"
- GPU, RTX, RX, graphics card = "gpu"
- Cooler, AIO, air cooler = "cpucooler"
- SSD, NVMe, M.2 = "ssd"
- PSU, power supply = "powersupply"
- Case, chassis = "case"
- Fan, fans = "casefans"
- If unclear, use "other"

I will send items in this format:
Item Name | product_id | variant_id | qty

If a value is missing, I may leave it blank.

When I send the item list, convert it directly into the JSON array and return only the JSON.
```

## Example Input

```text
Ryzen 7 9800X3D (Tray Type) | 8299576361097 |  | 1
MSI MAG B850M Mortar WiFi | 8282534576265 |  | 1
16 GB x 2 (32GB) 6000 Mhz CL38 T-Force Delta | 7998939431049 | 43363888136329 | 1
```

## Example Output

```json
[
  {
    "tab": "processor",
    "product_id": "8299576361097",
    "variant_id": "",
    "qty": 1,
    "label": "Ryzen 7 9800X3D (Tray Type)"
  },
  {
    "tab": "motherboard",
    "product_id": "8282534576265",
    "variant_id": "",
    "qty": 1,
    "label": "MSI MAG B850M Mortar WiFi"
  },
  {
    "tab": "memory",
    "product_id": "7998939431049",
    "variant_id": "43363888136329",
    "qty": 1,
    "label": "16 GB x 2 (32GB) 6000 Mhz CL38 T-Force Delta"
  }
]
```

## Shorter Daily-Use Prompt

If you want a shorter version:

```text
Convert my item list into valid JSON for the Shopify `pc_builder_promo.required_components` field.

Return JSON only.
No explanation.
No markdown fences.
Output must be a JSON array.

Each object must be:
{
  "tab": "...",
  "product_id": "...",
  "variant_id": "...",
  "qty": 1,
  "label": "..."
}

Use only these tabs:
"processor", "motherboard", "memory", "gpu", "cpucooler", "ssd", "powersupply", "case", "casefans", "other"

Rules:
- Keep IDs as strings
- Always include all keys
- Missing product_id or variant_id should be ""
- Default qty to 1 unless I provide another qty
- Preserve the item name exactly in `label`
- Infer `tab` from the item name

My input format:
Item Name | product_id | variant_id | qty
```

## Optional Full Promo Object Prompt

Use this only if you want ChatGPT to generate the full promo object instead of just `required_components`.

```text
You are helping me build a full Shopify `pc_builder_promo` JSON object.

Return valid JSON only.
No explanation.
No markdown fences.

Use this exact object shape:
{
  "handle": "",
  "promo_label": "",
  "is_active": true,
  "discount_amount": 0,
  "stack_with_bundle_discount": true,
  "required_components": [],
  "badge_label": "",
  "description": "",
  "terms": "",
  "starts_at": "",
  "ends_at": "",
  "priority": 0,
  "public_visibility": false,
  "image_url": ""
}

Rules:
- `required_components` must follow the exact component schema I gave earlier
- Keep IDs as strings
- Keep empty optional text fields as ""
- Keep booleans as true/false
- Keep numbers as numbers
- Do not add extra keys
```
