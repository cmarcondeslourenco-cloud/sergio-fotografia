'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/config';

const schema = z.object({
  title: z.string().trim().min(3, 'Informe um título com pelo menos 3 caracteres.').max(140),
  slug: z.string().trim().min(3, 'O endereço precisa de pelo menos 3 caracteres.').max(100).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
  visibility: z.enum(['private', 'unlisted', 'public']),
});

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function NewGalleryForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const parsed = schema.safeParse({ title, slug, visibility });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise os campos.');
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) { setError('Supabase não configurado.'); return; }
    setLoading(true);
    try {
      const { data: gallery, error: insertError } = await client
        .from('galleries')
        .insert(parsed.data)
        .select('slug')
        .single();
      if (insertError) {
        setError(insertError.code === '23505' ? 'Este endereço já está em uso.' : 'Não foi possível criar a galeria.');
        return;
      }
      if (gallery) {
        router.push(`/admin/galerias/${gallery.slug}`);
        router.refresh();
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 border border-white/10 bg-surface p-6 md:grid-cols-2 md:p-9">
      <label className="text-sm text-zinc-300">
        Título
        <input
          value={title}
          onChange={(event) => {
            const value = event.target.value;
            setTitle(value);
            if (!slugEdited) setSlug(slugify(value));
          }}
          placeholder="Ex.: Casamento de Ana e Rafael"
          className="field mt-2"
          maxLength={140}
          required
        />
      </label>
      <label className="text-sm text-zinc-300">
        Endereço da galeria
        <div className="mt-2 flex items-center border border-white/15 bg-black/20 pl-3 focus-within:border-gold">
          <span className="text-xs text-zinc-600">/</span>
          <input
            value={slug}
            onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }}
            placeholder="casamento-ana-rafael"
            className="w-full bg-transparent px-2 py-3 text-white outline-none"
            maxLength={100}
            required
          />
        </div>
      </label>
      <label className="text-sm text-zinc-300">
        Visibilidade
        <select value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)} className="field mt-2">
          <option value="private">Privada — somente por acesso autorizado</option>
          <option value="unlisted">Não listada — somente por link</option>
          <option value="public">Pública — pode aparecer no portfólio</option>
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={loading} className="button-primary w-full">{loading ? 'Criando…' : 'Criar galeria'}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-300 md:col-span-2">{error}</p>}
    </form>
  );
}
