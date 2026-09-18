-- Galerias públicas administráveis usadas pelo portfólio e pela página inicial.
insert into public.galleries as target (slug, title, visibility, published_at, metadata, sort_order)
values
  ('casamentos', 'Casamentos', 'public', now(), '{"placement":"portfolio","max_photos":25,"featured_photos":5,"loop_interval_ms":4000}', 1),
  ('ensaios', 'Ensaios', 'public', now(), '{"placement":"portfolio","max_photos":25,"featured_photos":5,"loop_interval_ms":4000}', 2),
  ('eventos', 'Eventos', 'public', now(), '{"placement":"portfolio","max_photos":25,"featured_photos":5,"loop_interval_ms":4000}', 3),
  ('astrofotografia', 'Astrofotografia', 'public', now(), '{"placement":"portfolio","max_photos":25,"featured_photos":5,"loop_interval_ms":4000}', 4)
on conflict (slug) do update set
  visibility = excluded.visibility,
  published_at = coalesce(target.published_at, excluded.published_at),
  metadata = target.metadata || excluded.metadata,
  sort_order = excluded.sort_order;

create or replace function public.enforce_portfolio_photo_limit()
returns trigger
language plpgsql
as $$
declare
  gallery_slug text;
  portfolio_photo_count integer;
begin
  select slug into gallery_slug from public.galleries where id = new.gallery_id;
  if gallery_slug in ('casamentos', 'ensaios', 'eventos', 'astrofotografia') then
    select count(*) into portfolio_photo_count from public.photos where gallery_id = new.gallery_id;
    if portfolio_photo_count >= 25 then
      raise exception 'As galerias do portfólio permitem no máximo 25 imagens.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_photo_limit on public.photos;
create trigger portfolio_photo_limit
before insert on public.photos
for each row execute function public.enforce_portfolio_photo_limit();