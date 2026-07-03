"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseProductCsv } from "@/lib/csv";
import { quoteCode, slugify } from "@/lib/format";
import { createServiceSupabaseClient, createUserSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";
import { getCurrentShop, getShopBySlug } from "@/lib/data";

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
    facebook_page_url: cleanUrl(formData.get("facebook_page_url")),
    messenger_url: cleanUrl(formData.get("messenger_url")),
    phone: clean(formData.get("phone")),
    address: clean(formData.get("address")),
    logo_url: cleanUrl(formData.get("logo_url")),
    updated_at: new Date().toISOString()
  };

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

export async function importPublishedSheet(_state: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentShop();
  if (!current.shop) return { ok: false, message: "Create a shop profile before importing products." };

  const sourceUrl = cleanUrl(formData.get("source_url"));
  if (!sourceUrl) return { ok: false, message: "Paste a published Google Sheets CSV URL." };

  let csvText = "";
  try {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Import URL returned ${response.status}.`);
    csvText = await response.text();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not fetch the published sheet."
    };
  }

  const parsed = parseProductCsv(csvText);
  const service = createServiceSupabaseClient();
  let importedRows = 0;

  for (const row of parsed.rows) {
    const payload = {
      shop_id: current.shop.id,
      title: row.title,
      category: row.category,
      price: row.price,
      brand: row.brand || null,
      sku: row.sku || null,
      model: row.model || null,
      stock_status: row.stock_status || "available",
      image_url: row.image_url || null,
      product_url: row.product_url || null,
      description: row.description || null,
      specs: row.specs,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (row.sku) {
      const { data: existing } = await service
        .from("products")
        .select("id")
        .eq("shop_id", current.shop.id)
        .eq("sku", row.sku)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await service.from("products").update(payload).eq("id", existing.id);
        if (!error) importedRows += 1;
        continue;
      }
    }

    const { error } = await service.from("products").insert(payload);
    if (!error) importedRows += 1;
  }

  await service.from("product_imports").insert({
    shop_id: current.shop.id,
    source_type: "published_google_sheet_csv",
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

  return {
    ok: parsed.errors.length === 0,
    message: parsed.errors.length
      ? `Imported ${importedRows} products with ${parsed.errors.length} row issue(s).`
      : `Imported ${importedRows} products.`
  };
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

  if (!products?.length) return { ok: false, message: "Selected products are no longer available." };

  const lineItems = requestedItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      const unitPrice = Number(product.price || 0);
      return {
        product_id: product.id,
        title_snapshot: product.title,
        category_snapshot: product.category,
        quantity: item.quantity,
        unit_price_snapshot: unitPrice,
        line_total: unitPrice * item.quantity
      };
    })
    .filter(Boolean) as Array<{
    product_id: string;
    title_snapshot: string;
    category_snapshot: string;
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

  if (itemError) return { ok: false, message: itemError.message };

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
