'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/config';

type LoginState = 'idle' | 'loading' | 'invalid' | 'connection' | 'config';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/admin';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<LoginState>('idle');

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('erro');
    if (reason === 'configuracao') setState('config');
    if (reason === 'conexao') setState('connection');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    const client = createSupabaseBrowserClient();
    if (!client) { setState('config'); return; }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const result = await Promise.race([
        client.auth.signInWithPassword({ email: email.trim(), password }),
        new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('timeout')))),
      ]);
      if (result.error) { setState('invalid'); return; }
      // signInWithPassword só resolve com uma sessão quando a autenticação foi concluída.
      // Evitamos uma segunda chamada de rede aqui: ela podia transformar um login válido
      // em uma tela aparentemente travada em conexões instáveis.
      if (!result.data.session) { setState('connection'); return; }
      window.location.assign(safeNextPath(new URLSearchParams(window.location.search).get('next')));
    } catch {
      setState('connection');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const message =
    state === 'loading' ? 'Conectando ao servidor de autenticação…'
      : state === 'invalid' ? 'E-mail ou senha inválidos.'
        : state === 'connection' ? 'Não foi possível conectar ao Supabase. Verifique a rede e tente novamente.'
          : state === 'config' ? 'Integração Supabase não configurada neste ambiente.'
            : '';

  return (
    <main id="conteudo-principal" className="grid min-h-screen place-items-center px-6 pb-16 pt-32">
      <div className="w-full max-w-md">
        <Link href="/" className="text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-gold">← Voltar ao site</Link>
        <form onSubmit={submit} className="mt-6 border border-white/10 bg-surface p-7 shadow-glow md:p-10">
          <p className="eyebrow">Área administrativa</p>
          <h1 className="mt-4 font-display text-4xl text-linen">Acesso seguro</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Use as credenciais administrativas configuradas no Supabase.</p>
          <label className="mt-8 block text-sm text-zinc-300">
            E-mail
            <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field mt-2" />
          </label>
          <label className="mt-5 block text-sm text-zinc-300">
            Senha
            <input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field mt-2" />
          </label>
          {message && <p role="status" aria-live="polite" className={`mt-4 text-sm ${state === 'loading' ? 'text-gold' : 'text-red-300'}`}>{message}</p>}
          <button type="submit" disabled={state === 'loading'} className="button-primary mt-7 w-full">
            {state === 'loading' ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
