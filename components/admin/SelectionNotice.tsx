import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function SelectionNotice() {
  const client = await createSupabaseServerClient();
  const result = client ? await client.from('gallery_selections').select('id', { count: 'exact', head: true }) : null;
  return <section className="mt-8 border border-gold/30 p-5"><Link className="button-secondary" href="/admin/vendas">Pedidos, preços e seleções</Link><p className="mt-3 text-sm">{result?.error ? 'Seleções aguardando configuração do banco.' : `${result?.count ?? 0} seleção(ões) finalizada(s) pelo cliente.`}</p></section>;
}
