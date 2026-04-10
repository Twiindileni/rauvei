-- ─── Product likes (per user) + denormalized count on products ───────────────

alter table public.products
  add column if not exists likes_count integer not null default 0;

create table if not exists public.product_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_product_likes_product_id on public.product_likes(product_id);
create index if not exists idx_product_likes_user_id on public.product_likes(user_id);

alter table public.product_likes enable row level security;

drop policy if exists "Users read own product likes" on public.product_likes;
create policy "Users read own product likes"
  on public.product_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own product likes" on public.product_likes;
create policy "Users insert own product likes"
  on public.product_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own product likes" on public.product_likes;
create policy "Users delete own product likes"
  on public.product_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Admin read all product likes" on public.product_likes;
create policy "Admin read all product likes"
  on public.product_likes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admin delete product likes" on public.product_likes;
create policy "Admin delete product likes"
  on public.product_likes for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Keep products.likes_count in sync (public reads products already)
create or replace function public.product_likes_sync_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.products
    set likes_count = coalesce(likes_count, 0) + 1
    where id = new.product_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.products
    set likes_count = greatest(0, coalesce(likes_count, 0) - 1)
    where id = old.product_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_product_likes_ins on public.product_likes;
create trigger trg_product_likes_ins
  after insert on public.product_likes
  for each row execute function public.product_likes_sync_count();

drop trigger if exists trg_product_likes_del on public.product_likes;
create trigger trg_product_likes_del
  after delete on public.product_likes
  for each row execute function public.product_likes_sync_count();
