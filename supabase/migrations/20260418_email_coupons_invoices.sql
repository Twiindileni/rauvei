-- Coupon codes and invoice records generated from admin email campaigns

create table if not exists public.coupon_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text not null default '',
  discount_type   text not null default 'percent'
    check (discount_type in ('percent', 'fixed_amount')),
  discount_value  numeric(10,2) not null,
  starts_at       timestamptz not null default now(),
  expires_at      timestamptz,
  usage_limit     integer,
  used_count      integer not null default 0,
  active          boolean not null default true,
  campaign_id     uuid references public.email_campaigns(id) on delete set null,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists coupon_codes_active_expires_idx
  on public.coupon_codes (active, expires_at);

create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_number   text not null unique,
  order_id         uuid references public.orders(id) on delete set null,
  user_id          uuid references public.profiles(id) on delete set null,
  campaign_id      uuid references public.email_campaigns(id) on delete set null,
  currency         text not null default 'NAD',
  subtotal_amount  numeric(10,2) not null default 0,
  total_amount     numeric(10,2) not null default 0,
  status           text not null default 'issued'
    check (status in ('issued', 'paid', 'void', 'overdue')),
  issued_at        timestamptz not null default now(),
  due_at           timestamptz,
  paid_at          timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

create index if not exists invoices_order_idx on public.invoices (order_id);
create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc);

alter table public.coupon_codes enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Admin can manage coupon codes" on public.coupon_codes;
create policy "Admin can manage coupon codes"
  on public.coupon_codes for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "Admin can manage invoices" on public.invoices;
create policy "Admin can manage invoices"
  on public.invoices for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "Users read own invoices" on public.invoices;
create policy "Users read own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);
