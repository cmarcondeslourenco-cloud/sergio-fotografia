declare module '@/lib/storage/archive.mjs' {
  export function safeFilename(value: string, fallback?: string): string;
  export function attachmentHeader(filename: string): string;
  export function originalZip<T extends { id: string; filename: string }>(photos: T[], openOriginal: (photo: T) => Promise<import('node:stream').Readable>, signal?: AbortSignal): import('node:stream/web').ReadableStream;
}
