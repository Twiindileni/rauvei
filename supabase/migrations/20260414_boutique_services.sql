-- ─── Boutique services (user-facing catalog, admin-managed) ─────────────────
create table if not exists public.boutique_services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text not null,
  price_label     text not null,
  duration_label  text not null,
  tag             text,
  icon_key        text not null default 'star'
    check (icon_key in ('star', 'ruler', 'scissors', 'shopping-bag', 'gift', 'sparkles')),
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_boutique_services_updated_at on public.boutique_services;
create trigger trg_boutique_services_updated_at
  before update on public.boutique_services
  for each row execute function public.set_updated_at();

alter table public.boutique_services enable row level security;

drop policy if exists "Anyone can read active boutique services" on public.boutique_services;
create policy "Anyone can read active boutique services"
  on public.boutique_services for select
  using (active = true);

drop policy if exists "Admin can manage boutique services" on public.boutique_services;
create policy "Admin can manage boutique services"
  on public.boutique_services for all
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

-- ─── Service requests (dashboard form → admin inbox) ────────────────────────
create table if not exists public.service_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  service_id       uuid references public.boutique_services(id) on delete set null,
  service_title    text not null,
  customer_name    text not null,
  customer_email   text not null,
  message          text not null,
  status           text not null default 'pending'
    check (status in ('pending', 'contacted', 'completed', 'cancelled')),
  created_at       timestamptz not null default now()
);

create index if not exists service_requests_created_at_idx
  on public.service_requests (created_at desc);

alter table public.service_requests enable row level security;

drop policy if exists "Users insert own service requests" on public.service_requests;
create policy "Users insert own service requests"
  on public.service_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own service requests" on public.service_requests;
create policy "Users read own service requests"
  on public.service_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admin can manage service requests" on public.service_requests;
create policy "Admin can manage service requests"
  on public.service_requests for all
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

-- Seed defaults (matches previous hardcoded dashboard list)
insert into public.boutique_services (
  slug, title, description, price_label, duration_label, tag, icon_key, sort_order, active
) values
  (
    'styling-consultation',
    'Personal Styling Consultation',
    'A one-on-one session with our style expert Rauna Amutenya. She will curate a personal wardrobe plan, recommend pieces from our collection, and help you define your signature look.',
    'N$500',
    '1 hour',
    'Most Popular',
    'star',
    1,
    true
  ),
  (
    'custom-tailoring',
    'Custom Tailoring',
    'Have any LauVei garment tailored to your exact measurements for a perfect fit. Our master tailor ensures every seam, hem, and silhouette is crafted to your body.',
    'From N$200',
    '3–5 days',
    null,
    'ruler',
    2,
    true
  ),
  (
    'alterations',
    'Alterations & Repairs',
    'Breathe new life into your wardrobe. We offer expert alterations — hemming, resizing, zipper replacements, and general repairs — on LauVei and non-LauVei garments.',
    'From N$100',
    '1–3 days',
    null,
    'scissors',
    3,
    true
  ),
  (
    'personal-shopping',
    'Personal Shopping',
    'Let our team shop on your behalf. Tell us your occasion, budget, and style preferences and we will curate a selection delivered directly to your door.',
    'N$300',
    'Same day',
    null,
    'shopping-bag',
    4,
    true
  ),
  (
    'gift-wrapping',
    'Premium Gift Wrapping',
    'Elevate your gift with our luxury packaging service. Each item is hand-wrapped in signature LauVei tissue, sealed with a wax stamp, and presented in a branded gift box.',
    'N$150',
    'Included at pickup',
    null,
    'gift',
    5,
    true
  ),
  (
    'exclusive-preview',
    'New Arrival Preview Access',
    'Be the first to see and reserve pieces from our upcoming collections. Exclusive members receive private preview invitations before items are listed publicly.',
    'Free for members',
    'Seasonal',
    'Members Only',
    'sparkles',
    6,
    true
  )
on conflict (slug) do nothing;
