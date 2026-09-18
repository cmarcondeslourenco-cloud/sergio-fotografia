const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 150 * 1024 * 1024;
export function validateImageInput(input: { mime: string; size: number; filename?: string }) {
  if (!allowed.has(input.mime)) throw new Error('Formato não suportado. Use JPEG, PNG ou WEBP.');
  if (input.size <= 0 || input.size > MAX_IMAGE_BYTES) throw new Error('A imagem deve ter entre 1 byte e 150 MB.');
  if (input.filename !== undefined) {
    const extensions: Record<string, string[]> = { 'image/jpeg': ['jpg','jpeg'], 'image/png': ['png'], 'image/webp': ['webp'] };
    const extension = input.filename.split('.').pop()?.toLowerCase() ?? '';
    if (input.filename.length > 240 || /[\\/\x00-\x1f]/.test(input.filename) || !extensions[input.mime].includes(extension)) throw new Error('Nome ou extensão incompatível com a imagem.');
  }
  return true;
}
