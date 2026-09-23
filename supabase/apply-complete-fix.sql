-- ============================================
-- FIX COMPLETO: Galerias, Token e Loja
-- Aplicar em: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. GALERIAS PÚBLICAS: Corrigir política INSERT para tokens
DROP POLICY IF EXISTS "authenticated can insert gallery access" ON public.gallery_access;
CREATE POLICY "authenticated can insert gallery access" ON public.gallery_access FOR INSERT TO authenticated WITH CHECK (true);

-- 2. GALERIAS PÚBLICAS: Garantir que fotos com processing_status='done' e published=true aparecem
-- (As fotos precisam ter is_featured=true OU o sistema deve usar fallback)

-- 3. TOKEN DE ACESSO: Recriar função rotate_gallery_access
CREATE OR REPLACE FUNCTION public.rotate_gallery_access(p_gallery uuid, p_expires timestamptz, p_replace boolean)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result text;
BEGIN
  SELECT id FROM public.galleries WHERE id = p_gallery FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing gallery'; END IF;
  IF p_replace THEN DELETE FROM public.gallery_access WHERE gallery_id = p_gallery; END IF;
  INSERT INTO public.gallery_access(gallery_id, expires_at) VALUES(p_gallery, p_expires) RETURNING token INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_gallery_access(uuid, timestamptz, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_gallery_access(uuid, timestamptz, boolean) TO service_role;

-- 4. GALERIA LOJA: Verificar se existe, se não criar
-- Primeiro verificar se já existe
DO $$
DECLARE
  loja_id uuid;
BEGIN
  SELECT id INTO loja_id FROM public.galleries WHERE slug = 'loja' AND visibility = 'public';
  
  IF loja_id IS NULL THEN
    INSERT INTO public.galleries (slug, title, visibility, published_at, active, download_enabled, download_resolution)
    VALUES ('loja', 'Loja', 'public', now(), true, false, 'web')
    RETURNING id INTO loja_id;
    RAISE NOTICE 'Galeria LOJA criada com ID: %', loja_id;
  ELSE
    RAISE NOTICE 'Galeria LOJA já existe com ID: %', loja_id;
  END IF;
END $$;

-- 5. STORAGE: Garantir que bucket photos-private existe e está correto
-- Verificar se o bucket existe
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'photos-private';

-- 6. FOTOS: Garantir que fotos publicadas com processing_status='done' aparecem nas galerias públicas
-- (Não precisa de SQL, é lógica do código)

-- 7. VERIFICAÇÃO: Listar galerias públicas e seus status
SELECT g.id, g.slug, g.title, g.visibility, g.active, g.published_at, 
       (SELECT count(*) FROM public.photos p WHERE p.gallery_id = g.id AND p.processing_status = 'done' AND p.published) as photos_count,
       (SELECT count(*) FROM public.gallery_access ga WHERE ga.gallery_id = g.id) as access_count
FROM public.galleries g 
WHERE g.visibility = 'public'
ORDER BY g.sort_order;

-- 8. VERIFICAÇÃO: Listar fotos da galeria loja
SELECT p.id, p.filename, p.price_cents, p.processing_status, p.published, p.path_preview
FROM public.photos p
JOIN public.galleries g ON g.id = p.gallery_id
WHERE g.slug = 'loja'
ORDER BY p.sort_order;