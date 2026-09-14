-- Completa as políticas administrativas que faltavam no schema inicial.
-- Aplicar no Supabase após revisar o ambiente de destino.

create policy "admins manage gallery access"
on public.gallery_access for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

create policy "admins manage favorites"
on public.favorites for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

create policy "admins manage comments"
on public.comments for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

create policy "admins read downloads"
on public.downloads for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

create policy "admins update messages"
on public.messages for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

create index if not exists gallery_access_gallery_created_idx
on public.gallery_access (gallery_id, created_at desc);

create index if not exists downloads_gallery_downloaded_idx
on public.downloads (gallery_id, downloaded_at desc);

create index if not exists messages_unread_created_idx
on public.messages (created_at desc)
where read = false and archived = false;
