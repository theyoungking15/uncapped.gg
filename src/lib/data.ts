import { createServiceSupabaseClient, createUserSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";
import type { CurrentShop, Product, ProductImport, QuoteRequest, Shop } from "@/lib/types";

export async function getCurrentShop(): Promise<CurrentShop> {
  if (!hasSupabaseEnv()) return { shop: null, userId: null };

  const userClient = await createUserSupabaseClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  if (!user) return { shop: null, userId: null };

  const service = createServiceSupabaseClient();
  const { data: membership } = await service
    .from("shop_members")
    .select("shop_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.shop_id) return { shop: null, userId: user.id };

  const { data: shop } = await service.from("shops").select("*").eq("id", membership.shop_id).maybeSingle();
  return { shop: (shop as Shop | null) || null, userId: user.id };
}

export async function getDashboardStats(shopId: string) {
  if (!hasSupabaseEnv()) return { productCount: 0, quoteCount: 0, quoteValue: 0 };

  const service = createServiceSupabaseClient();
  const [{ count: productCount }, { count: quoteCount }, { data: quotes }] = await Promise.all([
    service.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("is_active", true),
    service.from("quote_requests").select("id", { count: "exact", head: true }).eq("shop_id", shopId),
    service.from("quote_requests").select("subtotal").eq("shop_id", shopId)
  ]);

  const quoteValue = (quotes || []).reduce((total, quote) => total + Number(quote.subtotal || 0), 0);
  return {
    productCount: productCount || 0,
    quoteCount: quoteCount || 0,
    quoteValue
  };
}

export async function getProducts(shopId: string): Promise<Product[]> {
  if (!hasSupabaseEnv()) return [];

  const service = createServiceSupabaseClient();
  const { data } = await service
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  return (data || []) as Product[];
}

export async function getActiveProducts(shopId: string): Promise<Product[]> {
  if (!hasSupabaseEnv()) return [];

  const service = createServiceSupabaseClient();
  const { data } = await service
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("price", { ascending: true });

  return (data || []) as Product[];
}

export async function getImports(shopId: string): Promise<ProductImport[]> {
  if (!hasSupabaseEnv()) return [];

  const service = createServiceSupabaseClient();
  const { data } = await service
    .from("product_imports")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data || []) as ProductImport[];
}

export async function getQuotes(shopId: string): Promise<QuoteRequest[]> {
  if (!hasSupabaseEnv()) return [];

  const service = createServiceSupabaseClient();
  const { data } = await service
    .from("quote_requests")
    .select("*, quote_items(*)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []) as QuoteRequest[];
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  if (!hasSupabaseEnv()) return null;

  const service = createServiceSupabaseClient();
  const { data } = await service.from("shops").select("*").eq("slug", slug).maybeSingle();
  return (data as Shop | null) || null;
}
