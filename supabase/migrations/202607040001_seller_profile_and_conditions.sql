alter table public.shops
  add column if not exists about text,
  add column if not exists facebook_marketplace_url text,
  add column if not exists external_review_url text,
  add column if not exists external_rating numeric(3, 2),
  add column if not exists external_review_count integer;

alter table public.products
  add column if not exists condition text not null default 'brand_new';

alter table public.quote_items
  add column if not exists condition_snapshot text;

update public.products
set condition = 'brand_new'
where condition is null or condition = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_condition_check'
  ) then
    alter table public.products
      add constraint products_condition_check
      check (condition in ('brand_new', 'new_open_box', 'used_like_new', 'used_good', 'as_is'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_items_condition_snapshot_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_condition_snapshot_check
      check (
        condition_snapshot is null or
        condition_snapshot in ('brand_new', 'new_open_box', 'used_like_new', 'used_good', 'as_is')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_external_rating_check'
  ) then
    alter table public.shops
      add constraint shops_external_rating_check
      check (external_rating is null or (external_rating >= 0 and external_rating <= 5));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_external_review_count_check'
  ) then
    alter table public.shops
      add constraint shops_external_review_count_check
      check (external_review_count is null or external_review_count >= 0);
  end if;
end $$;

create index if not exists products_shop_listing_filters_idx
on public.products(shop_id, is_active, category, condition);
