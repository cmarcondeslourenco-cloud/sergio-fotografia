const FALLBACK_SITE_URL = 'http://localhost:3000';

export const siteConfig = {
  name: 'Fotografia Amigo',
  shortName: 'Fotografia',
  description:
    'Fotografia autoral, cobertura de eventos e galerias privadas para reviver cada história com calma.',
} as const;

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configured || FALLBACK_SITE_URL);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}
