-- ─── Page Content ────────────────────────────────────────────────────────────
-- Stores editable storefront content (hero, about, images, etc.)
create table if not exists public.page_content (
  key         text primary key,
  value       text not null default '',
  label       text not null default '',
  type        text not null default 'text'
    check (type in ('text', 'textarea', 'image_url', 'url')),
  section     text not null default 'general',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id)
);

alter table public.page_content enable row level security;

-- Anyone can read page content (needed for storefront rendering)
drop policy if exists "Public can read page content" on public.page_content;
create policy "Public can read page content"
  on public.page_content for select
  using (true);

-- Only admins can modify page content
drop policy if exists "Admin can manage page content" on public.page_content;
create policy "Admin can manage page content"
  on public.page_content for all
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

-- Seed default page content values
insert into public.page_content (key, label, value, type, section) values
  ('hero_title',       'Hero Title',         'Setting Fashion Trend',        'text',      'hero'),
  ('hero_subtitle',    'Hero Subtitle',      'The 2026 Collection',          'text',      'hero'),
  ('hero_description', 'Hero Description',   'Experience the pinnacle of Namibian elegance. Our curated pieces are designed for those who dare to define their own style.', 'textarea', 'hero'),
  ('hero_image_url',   'Hero Image URL',     '/hero.png',                    'image_url', 'hero'),
  ('about_title',      'About Title',        'A Vision of Elegance',         'text',      'about'),
  ('about_text',       'About Body Text',    'RauVei Fashion Boutique was born from a passion for timeless elegance and modern trends. Our mission is to empower individuals to express their unique identity through fashion.', 'textarea', 'about'),
  ('ceo_name',         'CEO Name',           'Rauna Amutenya',               'text',      'about'),
  ('ceo_image_url',    'CEO Photo URL',      '/CEO.jpg',                     'image_url', 'about'),
  ('ceo_phone',        'CEO Phone',          '+264 81 286 0088',             'text',      'about')
on conflict (key) do nothing;
