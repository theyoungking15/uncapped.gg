alter table public.products
  add column if not exists inventory_quantity integer not null default 0,
  add column if not exists availability_status text not null default 'on_hand',
  add column if not exists show_inventory_quantity boolean not null default false;

alter table public.quote_items
  add column if not exists availability_status_snapshot text,
  add column if not exists lead_time_label_snapshot text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_inventory_quantity_check'
  ) then
    alter table public.products
      add constraint products_inventory_quantity_check
      check (inventory_quantity >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_availability_status_check'
  ) then
    alter table public.products
      add constraint products_availability_status_check
      check (availability_status in ('on_hand', 'pre_order', 'sold_out'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'quote_items_availability_status_snapshot_check'
  ) then
    alter table public.quote_items
      add constraint quote_items_availability_status_snapshot_check
      check (
        availability_status_snapshot is null or
        availability_status_snapshot in ('on_hand', 'pre_order', 'sold_out')
      );
  end if;
end $$;

create index if not exists products_shop_availability_idx
on public.products(shop_id, is_active, availability_status);
