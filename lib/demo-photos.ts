export type PortfolioCategory = 'Casamentos' | 'Ensaios' | 'Eventos' | 'Astrofotografia';

export type DemoPhoto = {
  src: string;
  alt: string;
  caption: string;
  category: PortfolioCategory;
  width: number;
  height: number;
  position?: string;
};

export const demoPhotos: DemoPhoto[] = [
  {
    src: '/editorial/casamento-hero.webp',
    alt: 'Casal caminhando no campo durante o pôr do sol',
    caption: 'Promessas ao fim da tarde',
    category: 'Casamentos',
    width: 1680,
    height: 945,
    position: '70% center',
  },
  {
    src: '/editorial/ensaio.webp',
    alt: 'Retrato feminino em um pátio de arquitetura natural',
    caption: 'Retrato, presença e naturalidade',
    category: 'Ensaios',
    width: 1024,
    height: 1536,
    position: '50% 28%',
  },
  {
    src: '/editorial/evento.webp',
    alt: 'Convidados adultos dançando em uma celebração noturna',
    caption: 'A energia que fica na memória',
    category: 'Eventos',
    width: 1024,
    height: 1536,
    position: '50% 25%',
  },
  {
    src: '/editorial/astrofotografia.webp',
    alt: 'Via Láctea arqueada sobre montanhas e um observador',
    caption: 'Silêncio sob a Via Láctea',
    category: 'Astrofotografia',
    width: 1536,
    height: 1024,
    position: 'center',
  },
];

export const categorySlugs: Record<PortfolioCategory, string> = {
  Casamentos: 'casamentos',
  Ensaios: 'ensaios',
  Eventos: 'eventos',
  Astrofotografia: 'astrofotografia',
};

export function normalizeCategory(value?: string) {
  if (!value) return null;
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return demoPhotos.find((photo) =>
    photo.category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalized,
  )?.category ?? null;
}
