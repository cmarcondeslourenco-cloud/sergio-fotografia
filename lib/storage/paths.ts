export function imageObjectPath(galleryId: string, photoId: string, variant: string, extension = 'webp') { return `galleries/${galleryId}/photos/${photoId}/${variant}.${extension}`; }
export function originalObjectPath(galleryId: string, photoId: string, filename: string) { return `private/${galleryId}/originals/${photoId}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`; }
