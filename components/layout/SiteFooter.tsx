import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20 px-6 py-12 text-xs text-zinc-500 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link href="/" className="font-display text-2xl text-linen">
            Fotografia<span className="text-gold">.</span>
          </Link>
          <p className="mt-3 max-w-sm leading-6">Histórias reais, presença e memória transformadas em uma experiência visual serena.</p>
        </div>
        <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 uppercase tracking-[0.12em]">
          <Link className="hover:text-gold" href="/portfolio">Portfólio</Link>
          <Link className="hover:text-gold" href="/contato">Contato</Link>
          <Link className="hover:text-gold" href="/politica-de-privacidade">Privacidade</Link>
          <Link className="hover:text-gold" href="/termos-de-uso">Termos</Link>
        </nav>
        <p className="border-t border-white/10 pt-6 md:col-span-2">© {new Date().getFullYear()} Fotografia Amigo. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
