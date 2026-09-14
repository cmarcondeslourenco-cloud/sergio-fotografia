export const imagePolicy = { maxUploadBytes: 150 * 1024 * 1024, signedUrlTtlSeconds: 60 * 60, publicVariants: ['thumbnail', 'preview', 'web'] as const, privateVariants: ['original', 'watermark'] as const } as const;
export type ImageVariant = (typeof imagePolicy.publicVariants[number] | typeof imagePolicy.privateVariants[number]);
export function isPublicVariant(variant: ImageVariant) { return (imagePolicy.publicVariants as readonly string[]).includes(variant); }
