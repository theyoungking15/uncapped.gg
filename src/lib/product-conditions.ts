export const PRODUCT_CONDITIONS = [
  { key: "brand_new", label: "Brand new" },
  { key: "new_open_box", label: "New open box" },
  { key: "used_like_new", label: "Used like new" },
  { key: "used_good", label: "Used good" },
  { key: "as_is", label: "As is" }
] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]["key"];

const CONDITION_LABELS = Object.fromEntries(PRODUCT_CONDITIONS.map((condition) => [condition.key, condition.label])) as Record<
  ProductCondition,
  string
>;

const CONDITION_ALIASES: Record<string, ProductCondition> = {
  brandnew: "brand_new",
  "brand-new": "brand_new",
  brand_new: "brand_new",
  "brand new": "brand_new",
  new: "brand_new",
  sealed: "brand_new",
  unopened: "brand_new",
  openbox: "new_open_box",
  "open-box": "new_open_box",
  open_box: "new_open_box",
  "open box": "new_open_box",
  "new-open-box": "new_open_box",
  new_open_box: "new_open_box",
  "new open box": "new_open_box",
  likenew: "used_like_new",
  "like-new": "used_like_new",
  like_new: "used_like_new",
  "like new": "used_like_new",
  "used-like-new": "used_like_new",
  used_like_new: "used_like_new",
  "used like new": "used_like_new",
  excellent: "used_like_new",
  used: "used_good",
  good: "used_good",
  "used-good": "used_good",
  used_good: "used_good",
  "used good": "used_good",
  working: "used_good",
  asis: "as_is",
  "as-is": "as_is",
  as_is: "as_is",
  "as is": "as_is",
  defective: "as_is",
  parts: "as_is",
  "for parts": "as_is"
};

export function normalizeProductCondition(value: string | null | undefined): ProductCondition | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, "_");

  if (!normalized) return null;
  return CONDITION_ALIASES[normalized] || CONDITION_ALIASES[normalized.replace(/\s+/g, "_")] || null;
}

export function productConditionOrDefault(value: string | null | undefined): ProductCondition {
  return normalizeProductCondition(value) || "brand_new";
}

export function productConditionLabel(value: string | null | undefined): string {
  return CONDITION_LABELS[productConditionOrDefault(value)];
}
