import type { Product } from "@/lib/types";

export const PRODUCT_AVAILABILITIES = [
  { key: "on_hand", label: "On hand" },
  { key: "pre_order", label: "Pre-order" },
  { key: "sold_out", label: "Sold out" }
] as const;

export type ProductAvailabilityStatus = (typeof PRODUCT_AVAILABILITIES)[number]["key"];

const STATUS_LABELS: Record<ProductAvailabilityStatus, string> = Object.fromEntries(
  PRODUCT_AVAILABILITIES.map((item) => [item.key, item.label])
) as Record<ProductAvailabilityStatus, string>;

const STATUS_ALIASES: Record<string, ProductAvailabilityStatus> = {
  available: "on_hand",
  "in stock": "on_hand",
  instock: "on_hand",
  "in-stock": "on_hand",
  onhand: "on_hand",
  "on hand": "on_hand",
  "on-hand": "on_hand",
  on_hand: "on_hand",
  preorder: "pre_order",
  "pre order": "pre_order",
  "pre-order": "pre_order",
  pre_order: "pre_order",
  "order basis": "pre_order",
  order_basis: "pre_order",
  "by order": "pre_order",
  soldout: "sold_out",
  "sold out": "sold_out",
  "sold-out": "sold_out",
  sold_out: "sold_out",
  "out of stock": "sold_out",
  out_of_stock: "sold_out"
};

type AvailabilityProduct = Pick<
  Product,
  "availability_status" | "inventory_quantity" | "lead_time_label" | "show_inventory_quantity"
>;

export function normalizeProductAvailability(value: string | null | undefined): ProductAvailabilityStatus | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalized) return null;
  return STATUS_ALIASES[normalized] || null;
}

export function productAvailabilityOrDefault(value: string | null | undefined): ProductAvailabilityStatus {
  return normalizeProductAvailability(value) || "on_hand";
}

export function productAvailabilityLabel(value: string | null | undefined): string {
  return STATUS_LABELS[productAvailabilityOrDefault(value)];
}

export function productIsQuoteable(product: Pick<Product, "availability_status" | "is_active">): boolean {
  return product.is_active !== false && productAvailabilityOrDefault(product.availability_status) !== "sold_out";
}

export function productNeedsLeadTime(value: string | null | undefined): boolean {
  return productAvailabilityOrDefault(value) === "pre_order";
}

export function productAvailabilitySummary(product: AvailabilityProduct): string {
  const status = productAvailabilityOrDefault(product.availability_status);
  const parts = [STATUS_LABELS[status]];

  if (status === "pre_order" && product.lead_time_label) {
    parts.push(product.lead_time_label);
  }

  if (status === "on_hand" && product.show_inventory_quantity) {
    const quantity = Math.max(0, Number(product.inventory_quantity || 0));
    parts.push(`${quantity} ${quantity === 1 ? "available" : "available"}`);
  }

  return parts.join(" / ");
}
