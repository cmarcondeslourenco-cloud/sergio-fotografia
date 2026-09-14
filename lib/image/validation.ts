const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 150 * 1024 * 1024;
export function validateImageInput(input: { mime: string; size: number }) {
  if (!allowed.has(input.mime)) throw new Error('Formato não suportado. Use JPEG, PNG ou WEBP.');
  if (input.size <= 0 || input.size > MAX_IMAGE_BYTES) throw new Error('A imagem deve ter entre 1 byte e 150 MB.');
  return true;
}
