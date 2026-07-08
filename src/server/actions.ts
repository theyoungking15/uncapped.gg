"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseProductCsv, type ParsedProductRow } from "@/lib/csv";
import { quoteCode, slugify } from "@/lib/format";
import { PRODUCT_EDITOR_FIELDS } from "@/lib/product-editor-fields";
import { createServiceSupabaseClient, createUserSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";
import { getCurrentShop, getShopBySlug } from "@/lib/data";
import { normalizeProductCategory } from "@/lib/product-foundation";
import { productAvailabilityOrDefault, productIsQuoteable, productNeedsLeadTime } from "@/lib/product-availability";
import { productConditionOrDefault } from "@/lib/product-conditions";
import type { Product, ProductCatalogItem, ProductDataBag, ProductDataValue } from "@/lib/types";

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function signInWithEmail(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are not configured." };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { ok: false, message: "Enter an email address." };

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = await createUserSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Check your email for the sign-in link." };
}

export async function signOut() {
  const supabase = await createUserSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveShopProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentShop();
  if (!current.userId) return { ok: false, message: "Sign in before creating a shop profile." };

  const name = String(formData.get("name") || "").trim();
  const requestedSlug = slugify(String(formData.get("slug") || name));

  if (!name) return { ok: false, message: "Shop name is required." };
  if (!requestedSlug) return { ok: false, message: "Shop link slug is required." };

  const profile = {
    name,
    slug: requestedSlug,
    tagline: clean(formData.get("tagline")),
    about: cleanNullable(formData.get("about")),
    facebook_page_url: cleanUrl(formData.get("facebook_page_url")),
    facebook_marketplace_url: cleanUrl(formData.get("facebook_marketplace_url")),
    messenger_url: cleanUrl(formData.get("messenger_url")),
    external_review_url: cleanUrl(formData.get("external_review_url")) || null,
    external_rating: parseOptionalRating(formData.get("external_rating")),
    external_review_count: parseOptionalInteger(formData.get("external_review_count")),
    phone: clean(formData.get("phone")),
    address: clean(formData.get("address")),
    logo_url: cleanUrl(formData.get("logo_url")),
    updated_at: new Date().toISOString()
  };

  if (profile.external_rating !== null && (profile.external_rating < 0 || profile.external_rating > 5)) {
    return { ok: false, message: "External rating must be between 0 and 5." };
  }

  if (profile.external_review_count !== null && profile.external_review_count < 0) {
    return { ok: false, message: "External review count must be zero or higher." };
  }

  const service = createServiceSupabaseClient();

  if (current.shop) {
    const { error } = await service.from("shops").update(profile).eq("id", current.shop.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data: shop, error } = await service
      .from("shops")
      .insert({
        ...profile,
        created_by: current.userId
      })
      .select("id")
      .single();

    if (error) return { ok: false, message: error.message };

    const { error: memberError } = await service.from("shop_members").insert({
      shop_id: shop.id,
      user_id: current.userId,
      role: "owner"
    });

    if (memberError) return { ok: false, message: memberError.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath(`/shop/${requestedSlug}`);
  return { ok: true, message: "Shop profile saved." };
}

export async function importProducts(_state: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentShop();
  if (!current.shop) return { ok: false, message: "Create a shop profile before importing products." };

  let csvText = "";
  let sourceUrl = "";
  let sourceMode: "upload" | "url" = "url";

  const uploadedFile = formData.get("csv_file");
  try {
    if (isUploadedFile(uploadedFile)) {
      sourceMode = "upload";
      sourceUrl = `file:${uploadedFile.name || "products.csv"}`;
      csvText = await uploadedFile.text();
    } else {
      sourceUrl = cleanUrl(formData.get("source_url"));
      if (!sourceUrl) return { ok: false, message: "Paste a published CSV URL or choose a CSV file." };
      const response = await fetch(sourceUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Import URL returned ${response.status}.`);
      csvText = await response.text();
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not read the CSV source."
    };
  }

  const parsed = parseProductCsv(csvText);
  const service = createServiceSupabaseClient();
  let importedRows = 0;

  for (const row of parsed.rows) {
    const existingProduct = await findExistingProduct(service, current.shop.id, row);
    const catalogItem = await upsertCatalogItemFromRow(service, row);
    const payload = productPayload(
      current.shop.id,
      row,
      existingProduct?.condition || null,
      existingProduct?.availability_status || null,
      catalogItem?.id || existingProduct?.catalog_item_id || null
    );

    if (existingProduct?.id) {
      const { error } = await service.from("products").update(payload).eq("id", existingProduct.id);
      if (!error) importedRows += 1;
      continue;
    }

    const { error } = await service.from("products").insert(payload);
    if (!error) importedRows += 1;
  }

  await service.from("product_imports").insert({
    shop_id: current.shop.id,
    source_type: `${parsed.sourceType}_${sourceMode}`,
    source_url: sourceUrl,
    status: parsed.errors.length ? "completed_with_errors" : "completed",
    total_rows: parsed.totalRows,
    imported_rows: importedRows,
    error_rows: parsed.errors.length,
    error_report: parsed.errors
  });

  revalidatePath("/app");
  revalidatePath("/app/products");
  revalidatePath("/app/imports");
  revalidatePath(`/shop/${current.shop.slug}/pricelist`);
  revalidatePath(`/shop/${current.shop.slug}`);

  return {
    ok: parsed.errors.length === 0,
    message: parsed.errors.length
      ? `Imported ${importedRows} products with ${parsed.errors.length} row issue(s).`
      : `Imported ${importedRows} products from ${parsed.sourceType === "shopify_product_csv" ? "Shopify CSV" : "CSV"}.`
  };
}

export async function importPublishedSheet(state: ActionState, formData: FormData): Promise<ActionState> {
  return importProducts(state, formData);
}

export async function createProduct(_state: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentShop();
  if (!current.shop) return { ok: false, message: "Create a shop profile before adding listings." };

  const service = createServiceSupabaseClient();
  const catalogItem = await getSelectedCatalogItem(service, formData);
  const title = clean(formData.get("title")) || catalogItem?.canonical_name || "";
  const price = parseMoneyField(formData.get("price"));
  const availabilityStatus = productAvailabilityOrDefault(clean(formData.get("availability_status")));
  const leadTimeLabel = cleanNullable(formData.get("lead_time_label"));
  const pcBuilderEnabled = formData.get("pc_builder_enabled") === "on";

  if (!title) return { ok: false, message: "Listing title is required." };
  if (price === null || price < 0) return { ok: false, message: "Price must be zero or higher." };
  if (productNeedsLeadTime(availabilityStatus) && !leadTimeLabel) {
    return { ok: false, message: "Pre-order listings need a fulfillment lead time." };
  }
  if (pcBuilderEnabled && !catalogItem) {
    return { ok: false, message: "Choose a catalog item before enabling this listing for PC Builder." };
  }

  const handle = await buildUniqueProductHandle(service, current.shop.id, title);
  if (!handle) return { ok: false, message: "Listing link handle is required." };

  const imageUrl = cleanUrl(formData.get("image_url"));
  const payload = {
    shop_id: current.shop.id,
    catalog_item_id: catalogItem?.id || null,
    title,
    handle,
    category: catalogItem?.category || normalizeProductCategory(clean(formData.get("category"))),
    condition: productConditionOrDefault(clean(formData.get("condition"))),
    price,
    compare_at_price: parseOptionalMoneyField(formData.get("compare_at_price")),
    brand: catalogItem?.brand || cleanNullable(formData.get("brand")),
    sku: cleanNullable(formData.get("sku")),
    model: catalogItem?.model || catalogItem?.part_number || cleanNullable(formData.get("model")),
    stock_status: availabilityStatus,
    inventory_quantity: parseInventoryField(formData.get("inventory_quantity")),
    availability_status: availabilityStatus,
    show_inventory_quantity: formData.get("show_inventory_quantity") === "on",
    image_url: imageUrl || null,
    image_urls: imageUrl ? [imageUrl] : [],
    product_url: cleanUrl(formData.get("product_url")) || null,
    description: cleanNullable(formData.get("description")),
    quick_description: null,
    availability_tier: null,
    lead_time_label: leadTimeLabel,
    pc_builder_enabled: pcBuilderEnabled,
    specs: catalogItem?.specs || {},
    compat: catalogItem?.compat || {},
    source_metadata: {
      source: catalogItem ? "manual_listing_catalog" : "manual_listing",
      catalog_key: catalogItem?.catalog_key || null
    },
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };

  const { data: product, error } = await service.from("products").insert(payload).select("id").single();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/app");
  revalidatePath("/app/products");
  revalidatePath(`/shop/${current.shop.slug}`);
  revalidatePath(`/shop/${current.shop.slug}/pricelist`);
  redirect(`/app/products/${product.id}`);
}

export async function updateProduct(_state: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentShop();
  if (!current.shop) return { ok: false, message: "Create a shop profile before editing products." };

  const productId = clean(formData.get("product_id"));
  if (!productId) return { ok: false, message: "Missing product id." };

  const service = createServiceSupabaseClient();
  const { data: existing, error: existingError } = await service
    .from("products")
    .select("*")
    .eq("shop_id", current.shop.id)
    .eq("id", productId)
    .maybeSingle();

  if (existingError) return { ok: false, message: existingError.message };
  if (!existing) return { ok: false, message: "Product not found for this shop." };

  const product = existing as Product;
  const title = clean(formData.get("title"));
  const price = parseMoneyField(formData.get("price"));
  const availabilityStatus = productAvailabilityOrDefault(clean(formData.get("availability_status")));
  const leadTimeLabel = cleanNullable(formData.get("lead_time_label"));

  if (!title) return { ok: false, message: "Product title is required." };
  if (price === null || price < 0) return { ok: false, message: "Price must be zero or higher." };
  if (productNeedsLeadTime(availabilityStatus) && !leadTimeLabel) {
    return { ok: false, message: "Pre-order listings need a fulfillment lead time." };
  }

  const handle = product.handle || (await buildUniqueProductHandle(service, current.shop.id, title));
  const specs: ProductDataBag = { ...product.specs };
  const compat: ProductDataBag = { ...product.compat };

  PRODUCT_EDITOR_FIELDS.forEach((field) => {
    const raw = clean(formData.get(field.path));
    const [root, key] = field.path.split(".");
    const target = root === "specs" ? specs : root === "compat" ? compat : null;
    if (!target || !key) return;
    writeEditorField(target, key, raw, field.kind);
  });

  const imageUrl = cleanUrl(formData.get("image_url"));
  const imageUrls = imageUrl ? unique([imageUrl, ...(product.image_urls || [])]) : product.image_urls || [];

  const payload = {
    title,
    handle,
    category: normalizeProductCategory(clean(formData.get("category"))),
    condition: productConditionOrDefault(clean(formData.get("condition"))),
    price,
    compare_at_price: parseOptionalMoneyField(formData.get("compare_at_price")),
    brand: cleanNullable(formData.get("brand")),
    sku: cleanNullable(formData.get("sku")),
    model: cleanNullable(formData.get("model")),
    stock_status: clean(formData.get("stock_status")) || product.stock_status || availabilityStatus,
    inventory_quantity: parseInventoryField(formData.get("inventory_quantity")),
    availability_status: availabilityStatus,
    show_inventory_quantity: formData.get("show_inventory_quantity") === "on",
    image_url: imageUrl || product.image_url || null,
    image_urls: imageUrls,
    product_url: cleanUrl(formData.get("product_url")) || null,
    description: cleanNullable(formData.get("description")),
    quick_description: product.quick_description || null,
    availability_tier: parseOptionalInteger(formData.get("availability_tier")),
    lead_time_label: leadTimeLabel,
    pc_builder_enabled: formData.get("pc_builder_enabled") === "on",
    specs: removeEmptyValues(specs),
    compat: removeEmptyValues(compat),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };

  const { error } = await service.from("products").update(payload).eq("shop_id", current.shop.id).eq("id", product.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/app");
  revalidatePath("/app/products");
  revalidatePath(`/app/products/${product.id}`);
  revalidatePath(`/shop/${current.shop.slug}`);
  revalidatePath(`/shop/${current.shop.slug}/pricelist`);
  if (product.handle) revalidatePath(`/shop/${current.shop.slug}/products/${product.handle}`);
  if (handle) revalidatePath(`/shop/${current.shop.slug}/products/${handle}`);

  return { ok: true, message: "Product saved." };
}

function productPayload(
  shopId: string,
  row: ParsedProductRow,
  existingCondition: string | null,
  existingAvailability: string | null,
  catalogItemId: string | null
) {
  return {
    shop_id: shopId,
    catalog_item_id: catalogItemId,
    title: row.title,
    handle: row.handle || null,
    category: row.category,
    condition: row.condition || productConditionOrDefault(existingCondition),
    price: row.price,
    compare_at_price: row.compare_at_price,
    brand: row.brand || null,
    sku: row.sku || null,
    model: row.model || null,
    stock_status: row.stock_status || "available",
    inventory_quantity: row.inventory_quantity,
    availability_status: productAvailabilityOrDefault(row.availability_status || existingAvailability),
    show_inventory_quantity: row.show_inventory_quantity,
    image_url: row.image_url || null,
    image_urls: row.image_urls,
    product_url: row.product_url || null,
    description: row.description || null,
    quick_description: row.quick_description || null,
    availability_tier: row.availability_tier,
    lead_time_label: row.lead_time_label || null,
    pc_builder_enabled: row.pc_builder_enabled,
    specs: row.specs,
    compat: row.compat,
    source_metadata: row.source_metadata,
    is_active: row.is_active,
    updated_at: new Date().toISOString()
  };
}

async function findExistingProduct(
  service: SupabaseClient,
  shopId: string,
  row: ParsedProductRow
): Promise<{ id: string; condition: string | null; availability_status: string | null; catalog_item_id: string | null } | null> {
  const preferHandle = row.source_metadata?.source === "shopify_product_csv";

  if (preferHandle && row.handle) {
    const { data } = await service
      .from("products")
      .select("id, condition, availability_status, catalog_item_id")
      .eq("shop_id", shopId)
      .eq("handle", row.handle)
      .maybeSingle();
    if (data?.id) return data as { id: string; condition: string | null; availability_status: string | null; catalog_item_id: string | null };
    return null;
  }

  if (row.sku) {
    const { data } = await service
      .from("products")
      .select("id, condition, availability_status, catalog_item_id")
      .eq("shop_id", shopId)
      .eq("sku", row.sku)
      .maybeSingle();
    if (data?.id) return data as { id: string; condition: string | null; availability_status: string | null; catalog_item_id: string | null };
  }

  if (!preferHandle && row.handle) {
    const { data } = await service
      .from("products")
      .select("id, condition, availability_status, catalog_item_id")
      .eq("shop_id", shopId)
      .eq("handle", row.handle)
      .maybeSingle();
    if (data?.id) return data as { id: string; condition: string | null; availability_status: string | null; catalog_item_id: string | null };
  }

  return null;
}

async function upsertCatalogItemFromRow(service: SupabaseClient, row: ParsedProductRow): Promise<ProductCatalogItem | null> {
  const catalogKey = catalogKeyForRow(row);
  if (!catalogKey) return null;

  const partNumber = labelOfProductDataValue(row.specs.part_number) || row.model || row.sku || null;
  const payload = {
    catalog_key: catalogKey,
    category: row.category,
    brand: row.brand || null,
    canonical_name: row.title,
    model: row.model || partNumber,
    part_number: partNumber,
    search_aliases: unique([row.title, row.handle, row.brand, row.model, row.sku, partNumber || ""]),
    specs: row.specs,
    compat: row.compat,
    source_metadata: row.source_metadata,
    is_active: true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await service
    .from("product_catalog_items")
    .upsert(payload, { onConflict: "catalog_key" })
    .select("*")
    .single();

  if (error) return null;
  return data as ProductCatalogItem;
}

async function getSelectedCatalogItem(service: SupabaseClient, formData: FormData): Promise<ProductCatalogItem | null> {
  const catalogItemId = clean(formData.get("catalog_item_id"));
  if (!catalogItemId) return null;

  const { data } = await service
    .from("product_catalog_items")
    .select("*")
    .eq("id", catalogItemId)
    .eq("is_active", true)
    .maybeSingle();

  return (data as ProductCatalogItem | null) || null;
}

async function buildUniqueProductHandle(service: SupabaseClient, shopId: string, title: string): Promise<string> {
  const base = slugify(title);
  if (!base) return "";

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data } = await service
      .from("products")
      .select("id")
      .eq("shop_id", shopId)
      .eq("handle", candidate)
      .maybeSingle();

    if (!data?.id) return candidate;
  }

  return `${base}-${Date.now()}`;
}

function catalogKeyForRow(row: ParsedProductRow): string {
  const source = labelOfProductDataValue(row.source_metadata.source);
  const shopifyHandle = labelOfProductDataValue(row.source_metadata.shopify_handle);
  const sourceHandle = source === "shopify_product_csv" && shopifyHandle ? `shopify:${shopifyHandle}` : "";
  if (sourceHandle) return sourceHandle;

  return slugify([row.category, row.brand, row.model || row.sku || row.handle || row.title].filter(Boolean).join(" "));
}

function labelOfProductDataValue(value: ProductDataValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "size" in value &&
      "text" in value &&
      typeof value.size === "number" &&
      value.size > 0
  );
}

export async function submitPublicQuote(_state: ActionState, formData: FormData): Promise<ActionState> {
  const shopSlug = clean(formData.get("shop_slug"));
  const shop = shopSlug ? await getShopBySlug(shopSlug) : null;
  if (!shop) return { ok: false, message: "Shop not found." };

  const customerName = clean(formData.get("customer_name"));
  const contactMethod = clean(formData.get("contact_method")) || "messenger";
  const contactValue = clean(formData.get("contact_value"));
  const notes = clean(formData.get("notes"));

  if (!customerName) return { ok: false, message: "Enter your name." };
  if (!contactValue) return { ok: false, message: "Enter your contact detail." };

  const requestedItems = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("qty:"))
    .map(([key, rawValue]) => ({
      productId: key.replace("qty:", ""),
      quantity: Math.max(0, Math.floor(Number(rawValue || 0)))
    }))
    .filter((item) => item.quantity > 0);

  if (!requestedItems.length) return { ok: false, message: "Select at least one product for the quote." };

  const service = createServiceSupabaseClient();
  const { data: products } = await service
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .in(
      "id",
      requestedItems.map((item) => item.productId)
    );

  if (!products?.length || products.length !== requestedItems.length) {
    return { ok: false, message: "Selected products are no longer available." };
  }
  if (products.some((product) => !productIsQuoteable(product as Product))) {
    return { ok: false, message: "One or more selected items are sold out and cannot be quoted right now." };
  }

  const lineItems = requestedItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      const unitPrice = Number(product.price || 0);
      return {
        product_id: product.id,
        title_snapshot: product.title,
        category_snapshot: product.category,
        condition_snapshot: productConditionOrDefault(product.condition),
        availability_status_snapshot: productAvailabilityOrDefault(product.availability_status),
        lead_time_label_snapshot: product.lead_time_label || null,
        quantity: item.quantity,
        unit_price_snapshot: unitPrice,
        line_total: unitPrice * item.quantity
      };
    })
    .filter(Boolean) as Array<{
    product_id: string;
    title_snapshot: string;
    category_snapshot: string;
    condition_snapshot: string;
    availability_status_snapshot: string;
    lead_time_label_snapshot: string | null;
    quantity: number;
    unit_price_snapshot: number;
    line_total: number;
  }>;

  const subtotal = lineItems.reduce((total, item) => total + item.line_total, 0);
  const { data: quote, error } = await service
    .from("quote_requests")
    .insert({
      shop_id: shop.id,
      quote_code: quoteCode(),
      customer_name: customerName,
      contact_method: contactMethod,
      contact_value: contactValue,
      notes: notes || null,
      status: "new",
      subtotal
    })
    .select("id, quote_code")
    .single();

  if (error) return { ok: false, message: error.message };

  const { error: itemError } = await service.from("quote_items").insert(
    lineItems.map((item) => ({
      ...item,
      quote_id: quote.id
    }))
  );

  if (itemError) {
    await service.from("quote_requests").delete().eq("id", quote.id).eq("shop_id", shop.id);
    return { ok: false, message: quoteItemInsertMessage(itemError.message) };
  }

  revalidatePath("/app/quotes");
  return { ok: true, message: `Quote request sent. Your quote code is ${quote.quote_code}.` };
}

export async function updateQuoteStatus(formData: FormData) {
  const current = await getCurrentShop();
  if (!current.shop) redirect("/login");

  const quoteId = clean(formData.get("quote_id"));
  const status = clean(formData.get("status"));
  const allowed = ["new", "reviewing", "quoted", "closed"];
  if (!quoteId || !allowed.includes(status)) redirect("/app/quotes");

  const service = createServiceSupabaseClient();
  await service.from("quote_requests").update({ status }).eq("id", quoteId).eq("shop_id", current.shop.id);
  revalidatePath("/app/quotes");
  redirect("/app/quotes");
}

function clean(value: FormDataEntryValue | null): string {
  return String(value || "").trim();
}

function cleanNullable(value: FormDataEntryValue | null): string | null {
  const cleaned = clean(value);
  return cleaned || null;
}

function cleanUrl(value: FormDataEntryValue | null): string {
  const raw = clean(value);
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return "";
  }
}

function parseMoneyField(value: FormDataEntryValue | null): number | null {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalMoneyField(value: FormDataEntryValue | null): number | null {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = parseMoneyField(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function parseOptionalInteger(value: FormDataEntryValue | null): number | null {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parseInventoryField(value: FormDataEntryValue | null): number {
  const parsed = parseOptionalInteger(value);
  return parsed !== null ? Math.max(0, parsed) : 0;
}

function parseOptionalRating(value: FormDataEntryValue | null): number | null {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function quoteItemInsertMessage(message: string): string {
  if (message.includes("condition_snapshot")) {
    return "Database migration is missing quote_items.condition_snapshot. Apply the latest Supabase migrations, then submit the quote again.";
  }

  return message;
}

function writeEditorField(target: ProductDataBag, key: string, raw: string, kind: "text" | "list" | "number") {
  if (!raw) {
    delete target[key];
    return;
  }

  if (kind === "list") {
    const values = splitEditorList(raw);
    if (values.length) target[key] = values;
    else delete target[key];
    return;
  }

  if (kind === "number") {
    const parsed = Number(raw.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) target[key] = parsed;
    else delete target[key];
    return;
  }

  target[key] = raw;
}

function splitEditorList(value: string): string[] {
  return unique(
    value
      .split(/\r?\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function removeEmptyValues(input: ProductDataBag): ProductDataBag {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value as Record<string, ProductDataValue>).length > 0;
      return true;
    })
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
