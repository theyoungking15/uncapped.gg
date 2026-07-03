export type Shop = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  facebook_page_url: string | null;
  messenger_url: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  title: string;
  category: string;
  price: number;
  brand: string | null;
  sku: string | null;
  model: string | null;
  stock_status: string | null;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  specs: Record<string, string>;
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
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
};

export type CurrentShop = {
  shop: Shop | null;
  userId: string | null;
};

