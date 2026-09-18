import { PassThrough, Readable } from 'node:stream';
import { ZipArchive } from 'archiver';

export function safeFilename(value, fallback = 'fotografia') {
  return value.replace(/[\\/\r\n\0"\x00-\x1f]/g, '_').trim() || fallback;
}
export function attachmentHeader(filename) {
  const safe = safeFilename(filename);
  return `attachment; filename="${safe.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
export function originalZip(photos, openOriginal, signal) {
  const output = new PassThrough();
  const zip = new ZipArchive({ zlib: { level: 0 }, store: true });
  zip.on('error', error => output.destroy(error));
  zip.on('warning', error => output.destroy(error));
  zip.pipe(output);
  const abort = () => { zip.abort(); output.destroy(new Error('Download cancelado.')); };
  signal?.addEventListener('abort', abort, { once: true });
  output.on('close', () => { zip.abort(); signal?.removeEventListener('abort', abort); });
  void (async () => {
    const used = new Set();
    for (const [index, photo] of photos.entries()) {
      if (signal?.aborted || output.destroyed) throw new Error('Download cancelado.');
      let name = safeFilename(photo.filename, `foto-${index + 1}`);
      if (used.has(name)) name = `${photo.id}-${name}`;
      used.add(name);
      const source = await openOriginal(photo);
      const consumed = new Promise((resolve, reject) => {
        const fail = error => { source.destroy(); reject(error); };
        output.once('error', fail);
        source.once('error', reject);
        source.once('end', () => { output.off('error', fail); resolve(); });
      });
      zip.append(source, { name });
      await consumed;
    }
    await zip.finalize();
  })().catch(error => output.destroy(error));
  return Readable.toWeb(output);
}
