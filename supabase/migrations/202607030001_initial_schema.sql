create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  facebook_page_url text,
  messenger_url text,
  phone text,
  address text,
  logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  category text not null,
  price numeric(12, 2) not null default 0,
  brand text,
  sku text,
  model text,
  stock_status text,
  image_url text,
  product_url text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_shop_category_idx on public.products(shop_id, category);
create index if not exists products_shop_sku_idx on public.products(shop_id, sku) where sku is not null;

create table if not exists public.product_imports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  source_type text not null default 'published_google_sheet_csv',
  source_url text not null,
  status text not null default 'completed',
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  error_rows integer not null default 0,
  error_report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  quote_code text not null,
  customer_name text not null,
  contact_method text not null,
  contact_value text not null,
  notes text,
  status text not null default 'new',
  subtotal numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (shop_id, quote_code)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quote_requests(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title_snapshot text not null,
  category_snapshot text not null,
  quantity integer not null default 1,
  unit_price_snapshot numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
  );
$$;

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.products enable row level security;
alter table public.product_imports enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_items enable row level security;

drop policy if exists "Public can read shops" on public.shops;
create policy "Public can read shops"
on public.shops for select
using (true);

drop policy if exists "Members can manage shops" on public.shops;
create policy "Members can manage shops"
on public.shops for all
using (public.is_shop_member(id))
with check (created_by = auth.uid() or public.is_shop_member(id));

drop policy if exists "Members can read own memberships" on public.shop_members;
create policy "Members can read own memberships"
on public.shop_members for select
using (user_id = auth.uid());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (is_active = true or public.is_shop_member(shop_id));

drop policy if exists "Members can manage products" on public.products;
create policy "Members can manage products"
on public.products for all
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Members can manage imports" on public.product_imports;
create policy "Members can manage imports"
on public.product_imports for all
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Members can manage quotes" on public.quote_requests;
create policy "Members can manage quotes"
on public.quote_requests for all
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Members can read quote items" on public.quote_items;
create policy "Members can read quote items"
on public.quote_items for select
using (
  exists (
    select 1
    from public.quote_requests qr
    where qr.id = quote_id
      and public.is_shop_member(qr.shop_id)
  )
);

