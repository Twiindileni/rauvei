-- Admin email campaigns and recipient logs (promotions, coupons, invoices)

create table if not exists public.email_campaigns (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null
    check (kind in ('promotion', 'coupon', 'invoice', 'announcement')),
  audience      text not null
    check (audience in ('all_users', 'single', 'order_user')),
  subject       text not null,
  preview_text  text not null default '',
  body_html     text not null default '',
  from_email    text,
  status        text not null default 'draft'
    check (status in ('draft', 'sent', 'failed')),
  metadata      jsonb not null default '{}'::jsonb,
  sent_count    integer not null default 0,
  failed_count  integer not null default 0,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

create table if not exists public.email_campaign_recipients (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.email_campaigns(id) on delete cascade,
  user_id             uuid references public.profiles(id),
  email               text not null,
  full_name           text,
  status              text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  error               text,
  provider_message_id text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  unique (campaign_id, email)
);

create index if not exists email_campaigns_created_at_idx
  on public.email_campaigns (created_at desc);

create index if not exists email_campaign_recipients_campaign_idx
  on public.email_campaign_recipients (campaign_id, created_at desc);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;

drop policy if exists "Admin can manage email campaigns" on public.email_campaigns;
create policy "Admin can manage email campaigns"
  on public.email_campaigns for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "Admin can manage email campaign recipients" on public.email_campaign_recipients;
create policy "Admin can manage email campaign recipients"
  on public.email_campaign_recipients for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
