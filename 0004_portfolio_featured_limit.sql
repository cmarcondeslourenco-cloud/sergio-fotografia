-- Mantém no máximo cinco imagens selecionadas para o looping de cada galeria pública.
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

create or replace function public.enforce_portfolio_featured_limit()
returns trigger
language plpgsql
as $$
declare
  gallery_slug text;
  featured_count integer;
begin
  if new.is_featured then
    select slug into gallery_slug from public.galleries where id = new.gallery_id;
    if gallery_slug in ('casamentos', 'ensaios', 'eventos', 'astrofotografia') then
      select count(*) into featured_count from public.photos where gallery_id = new.gallery_id and is_featured and id <> new.id;
      if featured_count >= 5 then
        raise exception 'O looping das galerias do portfólio permite no máximo cinco imagens.' using errcode = 'check_violation';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_featured_limit on public.photos;
create trigger portfolio_featured_limit
before insert or update of is_featured on public.photos
for each row execute function public.enforce_portfolio_featured_limit();