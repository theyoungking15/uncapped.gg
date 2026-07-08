create table if not exists public.product_catalog_items (
  id uuid primary key default gen_random_uuid(),
  catalog_key text not null unique,
  category text not null,
  brand text,
  canonical_name text not null,
  model text,
  part_number text,
  search_aliases jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  compat jsonb not null default '{}'::jsonb,
  source_metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists catalog_item_id uuid references public.product_catalog_items(id) on delete set null;

create index if not exists product_catalog_items_category_idx
on public.product_catalog_items(category, is_active, brand);

create index if not exists product_catalog_items_search_idx
on public.product_catalog_items using gin (
  to_tsvector(
    'simple',
    coalesce(canonical_name, '') || ' ' ||
    coalesce(brand, '') || ' ' ||
    coalesce(model, '') || ' ' ||
    coalesce(part_number, '')
  )
);

create index if not exists products_shop_catalog_item_idx
on public.products(shop_id, catalog_item_id)
where catalog_item_id is not null;

alter table public.product_catalog_items enable row level security;

drop policy if exists "Public can read active catalog items" on public.product_catalog_items;
create policy "Public can read active catalog items"
on public.product_catalog_items for select
using (is_active = true);

notify pgrst, 'reload schema';
