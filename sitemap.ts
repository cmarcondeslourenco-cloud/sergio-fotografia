import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

const publicRoutes = ['', '/portfolio', '/casamentos', '/ensaios', '/eventos', '/loja', '/sobre', '/contato', '/politica-de-privacidade', '/termos-de-uso'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  return publicRoutes.map((path, index) => ({
    url: new URL(path || '/', baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: index < 6 ? 'weekly' : 'monthly',
    priority: index === 0 ? 1 : index < 6 ? 0.8 : 0.5,
  }));
}
