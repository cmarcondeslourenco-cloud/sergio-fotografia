export const portfolioGalleries = [
  { slug: 'casamentos', title: 'Casamentos' },
  { slug: 'ensaios', title: 'Ensaios' },
  { slug: 'eventos', title: 'Eventos' },
  { slug: 'venda-fotos', title: 'Loja' },
] as const;

export const portfolioGallerySlugs = portfolioGalleries.map((gallery) => gallery.slug);
export const portfolioMaxGalleryPhotos = 25;
export const portfolioMaxFeaturedPhotos = 5;
export const portfolioLoopIntervalMs = 4000;
