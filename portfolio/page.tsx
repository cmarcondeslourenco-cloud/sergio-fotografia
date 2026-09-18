import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Portfólio',
  description: 'Uma seleção de casamentos, ensaios, eventos e astrofotografia.',
};

export default function PortfolioPage() {
  redirect('/#portfolio');
}
