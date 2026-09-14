import Link from 'next/link';
import { NewGalleryForm } from '@/components/admin/NewGalleryForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminGalleriesPage() {
  const client = await createSupabaseServerClient();
  const { data: galleries } = client
    ? await client.from('galleries').select('id,title,slug,visibility,created_at').order('created_at', { ascending: false }).limit(12)
    : { data: null };

  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Admin · Galerias</p>
        <h1 className="mt-4 font-display text-5xl text-linen md:text-7xl">Criar e organizar.</h1>
        <p className="mt-6 max-w-xl leading-7 text-zinc-400">Comece uma entrega privada, não listada ou pública. O padrão seguro é sempre privado.</p>
        <div className="mt-10"><NewGalleryForm /></div>

        <section className="mt-14" aria-labelledby="recent-galleries">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Acesso rápido</p>
              <h2 id="recent-galleries" className="mt-2 font-display text-3xl text-linen">Galerias recentes</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{galleries?.length ?? 0} exibida(s)</span>
          </div>
          {galleries?.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {galleries.map((gallery) => (
                <Link key={gallery.id} href={`/admin/galerias/${gallery.slug}`} className="group flex items-center justify-between gap-4 border border-white/10 bg-surface p-5 transition-colors hover:border-gold">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-xl text-linen">{gallery.title}</h3>
                    <p className="mt-1 truncate text-xs text-zinc-500">/{gallery.slug} · {gallery.visibility}</p>
                  </div>
                  <span aria-hidden="true" className="text-gold transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Nenhuma galeria disponível neste ambiente.</p>
          )}
        </section>
      </div>
    </main>
  );
}
