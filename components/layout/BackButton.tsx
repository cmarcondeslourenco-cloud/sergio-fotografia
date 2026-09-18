'use client';
import { usePathname, useRouter } from 'next/navigation';
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === '/') return null;
  const fallback = pathname.startsWith('/admin/galerias/') ? '/admin/galerias' : pathname.startsWith('/admin/') ? '/admin' : '/';
  return <div className="px-6 pt-44 md:px-10 [&+main]:!pt-8"><button type="button" onClick={() => {
    const from = document.referrer;
    if (from && new URL(from).origin === window.location.origin && window.history.length > 1) router.back();
    else router.push(fallback);
  }} className="text-sm text-zinc-400 transition-colors hover:text-gold" aria-label="Voltar para a página anterior">← Voltar</button></div>;
}
