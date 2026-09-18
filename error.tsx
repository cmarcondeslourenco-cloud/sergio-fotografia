'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo-principal" className="grid min-h-[80vh] place-items-center px-6 py-32 text-center">
      <div className="max-w-xl">
        <p className="eyebrow">Algo saiu do enquadramento</p>
        <h1 className="mt-4 font-display text-5xl text-linen">Não foi possível abrir esta página.</h1>
        <p className="mt-5 leading-7 text-zinc-400">O problema pode ser temporário. Tente carregar o conteúdo novamente.</p>
        <button type="button" onClick={reset} className="button-primary mt-8">Tentar novamente</button>
      </div>
    </main>
  );
}
