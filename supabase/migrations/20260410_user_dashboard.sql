-- ─── Extend profiles ────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists full_name    text,
  add column if not exists phone        text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city          text,
  add column if not exists country       text default 'Namibia',
  add column if not exists avatar_url    text,
  add column if not exists updated_at    timestamptz not null default now();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Cart Items ──────────────────────────────────────────────────────────────
create table if not exists public.cart_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  product_id       text not null,
  product_name     text not null,
  product_image    text,
  product_category text,
  quantity         integer not null default 1 check (quantity > 0),
  unit_price       numeric(10,2) not null,
  added_at         timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users manage own cart" on public.cart_items;
create policy "Users manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  status           text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total_amount     numeric(10,2) not null,
  shipping_address text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own orders" on public.orders;
create policy "Users insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admin manage all orders" on public.orders;
create policy "Admin manage all orders"
  on public.orders for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- ─── Order Items ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       text not null,
  product_name     text not null,
  product_image    text,
  product_category text,
  quantity         integer not null default 1,
  unit_price       numeric(10,2) not null,
  subtotal         numeric(10,2) generated always as (quantity * unit_price) stored
);

alter table public.order_items enable row level security;

drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

drop policy if exists "Users insert own order items" on public.order_items;
create policy "Users insert own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- ─── Deliveries ──────────────────────────────────────────────────────────────
create table if not exists public.deliveries (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders(id) on delete cascade,
  user_id                 uuid not null references public.profiles(id),
  tracking_number         text,
  courier                 text,
  status                  text not null default 'preparing'
    check (status in ('preparing','dispatched','in_transit','out_for_delivery','delivered','failed','returned')),
  shipping_address        text not null,
  estimated_delivery_date date,
  delivered_at            timestamptz,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_deliveries_updated_at on public.deliveries;
create trigger trg_deliveries_updated_at
  before update on public.deliveries
  for each row execute function public.set_updated_at();

alter table public.deliveries enable row level security;

drop policy if exists "Users read own deliveries" on public.deliveries;
create policy "Users read own deliveries"
  on public.deliveries for select
  using (auth.uid() = user_id);

drop policy if exists "Admin manage all deliveries" on public.deliveries;
create policy "Admin manage all deliveries"
  on public.deliveries for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
