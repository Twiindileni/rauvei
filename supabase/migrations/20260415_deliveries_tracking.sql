-- Live location + customer confirmation for deliveries
alter table public.deliveries
  add column if not exists current_latitude   numeric(10, 7),
  add column if not exists current_longitude  numeric(10, 7),
  add column if not exists location_updated_at timestamptz,
  add column if not exists user_confirmed_at   timestamptz;

-- One shipment record per order
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deliveries_order_id_key'
  ) then
    alter table public.deliveries
      add constraint deliveries_order_id_key unique (order_id);
  end if;
end $$;

-- Customer confirms receipt (RLS blocks direct user updates on deliveries)
create or replace function public.confirm_delivery_received(p_delivery_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.deliveries
  set
    status = 'delivered',
    delivered_at = coalesce(delivered_at, now()),
    user_confirmed_at = now(),
    updated_at = now()
  where id = p_delivery_id
    and user_id = auth.uid()
    and status in ('dispatched', 'in_transit', 'out_for_delivery');
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

grant execute on function public.confirm_delivery_received(uuid) to authenticated;

-- Backfill shipment rows for existing orders (one per order)
insert into public.deliveries (order_id, user_id, shipping_address, status)
select o.id, o.user_id, o.shipping_address, 'preparing'
from public.orders o
where o.shipping_address is not null
  and not exists (select 1 from public.deliveries d where d.order_id = o.id);
