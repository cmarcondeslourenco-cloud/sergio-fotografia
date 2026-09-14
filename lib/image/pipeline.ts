import sharp from 'sharp';

export const imageVariants = {
  thumbnail: { width: 400, quality: 75 },
  preview: { width: 1200, quality: 82 },
  web: { width: 2000, quality: 88 },
  watermark: { width: 2000, quality: 88 },
} as const;

export async function createImageVariant(input: Buffer, variant: keyof typeof imageVariants, watermark?: Buffer) {
  const settings = imageVariants[variant];
  let image = sharp(input).rotate().resize({ width: settings.width, withoutEnlargement: true });
  if (variant === 'watermark' && watermark) image = image.composite([{ input: watermark, gravity: 'southeast' }]);
  return image.webp({ quality: settings.quality }).toBuffer();
}

export async function readImageMetadata(input: Buffer) {
  const metadata = await sharp(input).metadata();
  return { width: metadata.width ?? null, height: metadata.height ?? null, format: metadata.format ?? null, exif: metadata.exif ?? null };
}
