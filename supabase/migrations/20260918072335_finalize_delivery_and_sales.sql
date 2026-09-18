begin;

-- Self-service profile writes previously allowed a signed-in user to choose admin.
drop policy if exists "admins manage profiles" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from anon, authenticated;

alter table public.galleries add column active boolean not null default true;
alter table public.photos add column price_cents integer check (price_cents between 1 and 10000000);
alter table public.galleries alter column download_resolution set default 'full';

create table public.gallery_selections (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null check (length(trim(client_name)) between 2 and 120),
  session_hash text not null,
  photo_ids uuid[] not null,
  finalized_at timestamptz not null default now(),
  unique(gallery_id, session_hash)
);
alter table public.gallery_selections enable row level security;
revoke all on public.gallery_selections from anon, authenticated;
grant select on public.gallery_selections to authenticated;
grant all on public.gallery_selections to service_role;
create policy "staff reads selections" on public.gallery_selections for select to authenticated using (exists(select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','editor')));

create function public.save_client_selection(p_token text, p_photos uuid[], p_name text, p_finalize boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare a public.gallery_access; g public.galleries; h text;
begin
  select * into a from public.gallery_access where token = p_token for update;
  if not found or (a.expires_at is not null and a.expires_at <= now()) then raise exception 'Invalid access'; end if;
  select * into g from public.galleries where id = a.gallery_id and active and favorites_enabled;
  if not found then raise exception 'Unavailable gallery'; end if;
  if cardinality(p_photos) > 200 or cardinality(p_photos) <> (select count(distinct x) from unnest(p_photos) x)
    or cardinality(p_photos) <> (select count(*) from public.photos where id = any(p_photos) and gallery_id = g.id and published and processing_status = 'done') then raise exception 'Invalid selection'; end if;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  delete from public.favorites where gallery_id = g.id and session_token = h;
  insert into public.favorites(photo_id,gallery_id,session_token) select x,g.id,h from unnest(p_photos) x;
  if p_finalize then
    if cardinality(p_photos) = 0 or length(trim(p_name)) not between 2 and 120 then raise exception 'Invalid client or empty selection'; end if;
    insert into public.gallery_selections(gallery_id,client_id,client_name,session_hash,photo_ids)
    values(g.id,coalesce(a.client_id,g.client_id),trim(p_name),h,p_photos)
    on conflict(gallery_id,session_hash) do update set client_name=excluded.client_name,photo_ids=excluded.photo_ids,finalized_at=now();
  end if;
end $$;
revoke all on function public.save_client_selection(text,uuid[],text,boolean) from public,anon,authenticated;
grant execute on function public.save_client_selection(text,uuid[],text,boolean) to service_role;

create table public.photo_orders (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  status text not null default 'pending' check(status in ('pending','paid','cancelled')),
  total_cents integer not null check(total_cents > 0),
  pix_config jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  paid_at timestamptz,
  confirmed_by uuid references auth.users(id)
);
create table public.photo_order_items (
  order_id uuid not null references public.photo_orders(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  filename text not null,
  storage_path text not null,
  price_cents integer not null check(price_cents > 0),
  primary key(order_id,photo_id)
);
alter table public.photo_orders enable row level security;
alter table public.photo_order_items enable row level security;
revoke all on public.photo_orders,public.photo_order_items from anon,authenticated;
grant select on public.photo_orders,public.photo_order_items to authenticated;
grant all on public.photo_orders,public.photo_order_items to service_role;
create policy "staff reads orders" on public.photo_orders for select to authenticated using(exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','editor')));
create policy "staff reads order items" on public.photo_order_items for select to authenticated using(exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','editor')));

create function public.create_photo_order(p_hash text,p_photos uuid[],p_pix jsonb)
returns public.photo_orders language plpgsql security invoker set search_path='' as $$
declare result public.photo_orders; total integer; valid_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_hash,0));
  select * into result from public.photo_orders where token_hash=p_hash;
  if found then return result; end if;
  if cardinality(p_photos) not between 1 and 100 or cardinality(p_photos) <> (select count(distinct x) from unnest(p_photos) x) then raise exception 'Invalid cart'; end if;
  perform p.id from public.photos p join public.galleries g on g.id=p.gallery_id where p.id=any(p_photos) for share of p,g;
  select sum(p.price_cents),count(*) into total,valid_count from public.photos p join public.galleries g on g.id=p.gallery_id
  where p.id=any(p_photos) and p.price_cents>0 and p.published and p.processing_status='done' and p.path_preview is not null and g.active and g.visibility='public' and g.published_at<=now();
  if valid_count<>cardinality(p_photos) or total>999999999 then raise exception 'Unavailable photo'; end if;
  insert into public.photo_orders(token_hash,total_cents,pix_config) values(p_hash,total,p_pix) returning * into result;
  insert into public.photo_order_items(order_id,photo_id,filename,storage_path,price_cents)
  select result.id,id,filename,storage_path,price_cents from public.photos where id=any(p_photos);
  return result;
end $$;
revoke all on function public.create_photo_order(text,uuid[],jsonb) from public,anon,authenticated;
grant execute on function public.create_photo_order(text,uuid[],jsonb) to service_role;

-- Create the link in the same transaction as the gallery. No existing links change.
create function public.create_initial_gallery_access() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.visibility in ('private','unlisted') then
    insert into public.gallery_access(gallery_id,client_id) values(new.id,new.client_id);
  end if;
  return new;
end $$;
create trigger initial_gallery_access after insert on public.galleries for each row execute function public.create_initial_gallery_access();
revoke all on function public.create_initial_gallery_access() from public,anon,authenticated;

create function public.rotate_gallery_access(p_gallery uuid,p_expires timestamptz,p_replace boolean) returns text
language plpgsql security invoker set search_path='' as $$
declare result text;
begin
  perform id from public.galleries where id=p_gallery for update;
  if not found then raise exception 'Missing gallery'; end if;
  if p_replace then delete from public.gallery_access where gallery_id=p_gallery; end if;
  insert into public.gallery_access(gallery_id,expires_at) values(p_gallery,p_expires) returning token into result;
  return result;
end $$;
revoke all on function public.rotate_gallery_access(uuid,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.rotate_gallery_access(uuid,timestamptz,boolean) to service_role;

drop policy "public sees published galleries" on public.galleries;
create policy "public sees published galleries" on public.galleries for select using (active and visibility='public' and published_at<=now());
drop policy "public sees published photos" on public.photos;
create policy "public sees published photos" on public.photos for select using (published and exists(select 1 from public.galleries g where g.id=gallery_id and g.active and g.visibility='public' and g.published_at<=now()));
update storage.buckets set public=false,file_size_limit=157286400,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='photos-private';
commit;
