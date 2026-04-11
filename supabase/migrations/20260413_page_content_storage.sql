-- Public bucket for site/page images (heroes, CEO photo, etc.). Server actions upload with the service role (bypasses RLS); policies cover dashboard/client uploads if you switch later.

insert into storage.buckets (id, name, public)
values ('page-content', 'page-content', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read page content images" on storage.objects;
create policy "Public read page content images"
  on storage.objects for select
  using (bucket_id = 'page-content');

drop policy if exists "Admin insert page content images" on storage.objects;
create policy "Admin insert page content images"
  on storage.objects for insert
  with check (
    bucket_id = 'page-content'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admin update page content images" on storage.objects;
create policy "Admin update page content images"
  on storage.objects for update
  using (
    bucket_id = 'page-content'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admin delete page content images" on storage.objects;
create policy "Admin delete page content images"
  on storage.objects for delete
  using (
    bucket_id = 'page-content'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
