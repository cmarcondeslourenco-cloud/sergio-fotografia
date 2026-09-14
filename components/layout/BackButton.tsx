'use client';
import { useRouter } from 'next/navigation';
export function BackButton() { const router=useRouter(); return <button type="button" onClick={()=>window.history.length>1?router.back():router.push('/')} className="transition-colors hover:text-gold" aria-label="Voltar para a página anterior">Voltar</button>; }
