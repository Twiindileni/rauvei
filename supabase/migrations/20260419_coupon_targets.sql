-- Coupon applicability rules: all products, by collection, or specific product.

create table if not exists public.coupon_targets (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null references public.coupon_codes(id) on delete cascade,
  target_type  text not null
    check (target_type in ('all', 'collection', 'product')),
  collection   text
    check (collection in ('women', 'men', 'accessories', 'limited-edition')),
  product_id   uuid references public.products(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create unique index if not exists coupon_targets_unique_scope
  on public.coupon_targets (coupon_id, target_type, coalesce(collection, ''), coalesce(product_id::text, ''));

create index if not exists coupon_targets_coupon_idx
  on public.coupon_targets (coupon_id);

alter table public.coupon_targets enable row level security;

drop policy if exists "Admin can manage coupon targets" on public.coupon_targets;
create policy "Admin can manage coupon targets"
  on public.coupon_targets for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
