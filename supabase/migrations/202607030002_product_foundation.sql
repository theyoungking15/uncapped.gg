alter table public.products
  add column if not exists handle text,
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists quick_description text,
  add column if not exists availability_tier integer,
  add column if not exists lead_time_label text,
  add column if not exists pc_builder_enabled boolean not null default true,
  add column if not exists compat jsonb not null default '{}'::jsonb,
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists products_shop_handle_idx
on public.products(shop_id, handle)
where handle is not null;

create index if not exists products_shop_pc_builder_idx
on public.products(shop_id, pc_builder_enabled, is_active);
