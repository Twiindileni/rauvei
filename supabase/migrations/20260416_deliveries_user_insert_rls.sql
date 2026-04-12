-- Checkout creates a delivery row as the signed-in user; RLS previously allowed
-- only SELECT for users and full access for admins, so INSERT was denied.

drop policy if exists "Users insert own deliveries for own orders" on public.deliveries;
create policy "Users insert own deliveries for own orders"
  on public.deliveries for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = deliveries.order_id
        and o.user_id = auth.uid()
    )
  );
