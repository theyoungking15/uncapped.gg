export type Shop = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  facebook_page_url: string | null;
  facebook_marketplace_url: string | null;
  messenger_url: string | null;
  external_review_url: string | null;
  external_rating: number | null;
  external_review_count: number | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  catalog_item_id: string | null;
  handle: string | null;
  title: string;
  category: string;
  condition: string;
  price: number;
  compare_at_price: number | null;
  brand: string | null;
  sku: string | null;
  model: string | null;
  stock_status: string | null;
  inventory_quantity: number;
  availability_status: string;
  show_inventory_quantity: boolean;
  image_url: string | null;
  image_urls: string[];
  product_url: string | null;
  description: string | null;
  quick_description: string | null;
  availability_tier: number | null;
  lead_time_label: string | null;
  pc_builder_enabled: boolean;
  specs: ProductDataBag;
  compat: ProductDataBag;
  source_metadata: ProductDataBag;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductDataValue = string | number | boolean | null | ProductDataValue[] | { [key: string]: ProductDataValue };

export type ProductDataBag = Record<string, ProductDataValue>;

export type ProductCatalogItem = {
  id: string;
  catalog_key: string;
  category: string;
  brand: string | null;
  canonical_name: string;
  model: string | null;
  part_number: string | null;
  search_aliases: string[];
  specs: ProductDataBag;
  compat: ProductDataBag;
  source_metadata: ProductDataBag;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImport = {
  id: string;
  shop_id: string;
  source_type: string;
  source_url: string;
  status: string;
  total_rows: number;
  imported_rows: number;
  error_rows: number;
  error_report: ImportErrorRow[];
  created_at: string;
};

export type ImportErrorRow = {
  row: number;
  reason: string;
};

export type QuoteRequest = {
  id: string;
  shop_id: string;
  quote_code: string;
  customer_name: string;
  contact_method: string;
  contact_value: string;
  notes: string | null;
  status: string;
  subtotal: number;
  created_at: string;
  quote_items?: QuoteItem[];
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  title_snapshot: string;
  category_snapshot: string;
  condition_snapshot: string | null;
  availability_status_snapshot: string | null;
  lead_time_label_snapshot: string | null;
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
};

export type CurrentShop = {
  shop: Shop | null;
  userId: string | null;
};
