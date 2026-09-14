'use client';

import { useState, type FormEvent } from 'react';

const tokenPattern = /^[a-zA-Z0-9_-]{16,128}$/;

export default function ClientAccessPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = token.trim();
    if (!tokenPattern.test(value)) {
      setError('Confira o código recebido. Ele deve conter somente letras, números, hífen ou sublinhado.');
      return;
    }
    window.location.assign(`/c/${encodeURIComponent(value)}`);
  }

  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <p className="eyebrow">Entrega exclusiva</p>
          <h1 className="mt-4 font-display text-5xl leading-none text-linen md:text-7xl">Suas memórias, em um lugar só seu.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
            Use o código privado recebido do fotógrafo para rever, selecionar e baixar as fotografias autorizadas.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-zinc-400">
            <li className="border-l border-gold pl-4">Acesso protegido por código exclusivo</li>
            <li className="border-l border-gold pl-4">Seleção simples em celular ou computador</li>
            <li className="border-l border-gold pl-4">Downloads conforme as permissões da galeria</li>
          </ul>
        </div>

        <form onSubmit={submit} className="border border-white/10 bg-surface p-7 shadow-glow md:p-9">
          <label htmlFor="gallery-token" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Código da galeria</label>
          <input
            id="gallery-token"
            value={token}
            onChange={(event) => { setToken(event.target.value); setError(''); }}
            placeholder="Cole seu código de acesso"
            autoComplete="off"
            spellCheck={false}
            className="field mt-3 font-mono"
            required
            aria-describedby={error ? 'token-error' : 'token-help'}
          />
          <p id="token-help" className="mt-3 text-xs leading-5 text-zinc-500">O código está no link privado enviado pelo fotógrafo.</p>
          {error && <p id="token-error" role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          <button type="submit" className="button-primary mt-6 w-full">Abrir minha galeria</button>
        </form>
      </div>
    </main>
  );
}
