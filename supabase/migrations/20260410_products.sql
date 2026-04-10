-- ─── Products ────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  collection   text not null
    check (collection in ('women', 'men', 'accessories', 'limited-edition')),
  price        numeric(10,2) not null,
  image_url    text not null default '',
  alt_text     text not null default '',
  featured     boolean not null default false,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Anyone can read active products
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  using (active = true);

-- Admins can manage all products
drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ─── Seed existing static products ───────────────────────────────────────────
insert into public.products (name, category, collection, price, image_url, alt_text, featured, sort_order)
values
  ('Elegant Silk Dress',       'Evening Wear', 'women',           200.99, '/lau3.jpg',    'Woman Dress',       true,  1),
  ('Summer Chic Set',          'Coordinates',  'women',           325.99, '/lau2.jpg',    'Woman Short & Top', true,  2),
  ('Classic Evening Gown',     'Luxury',       'women',           250.00, '/lau3.jpg',    'Woman Dress',       false, 3),
  ('Bespoke Navy Suit',        'Formal',       'men',            1200.00, '/lau1.jpg',    'Mens Suit',         true,  4),
  ('Urban Explorer Shirt',     'Casual',       'men',             450.00, '/lau1.jpg',    'Mens Shirt',        false, 5),
  ('Vintage Leather Bag',      'Bags',         'accessories',     850.00, '/lauvei.png',  'Leather Bag',       true,  6),
  ('Gold Leaf Necklace',       'Jewelry',      'accessories',     500.00, '/lauvei.png',  'Gold Necklace',     false, 7),
  ('The RauVei Heritage Coat', 'Outerwear',    'limited-edition',3500.00, '/lau3.jpg',    'Heritage Coat',     true,  8)
on conflict do nothing;

-- ─── Storage bucket for product images ───────────────────────────────────────
-- Run this manually in Supabase SQL Editor if the bucket doesn't exist yet:
--
-- insert into storage.buckets (id, name, public)
-- values ('products', 'products', true)
-- on conflict do nothing;
--
-- create policy "Public read product images"
--   on storage.objects for select
--   using (bucket_id = 'products');
--
-- create policy "Admin upload product images"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'products'
--     and exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role = 'admin'
--     )
--   );
--
-- create policy "Admin delete product images"
--   on storage.objects for delete
--   using (
--     bucket_id = 'products'
--     and exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role = 'admin'
--     )
--   );
