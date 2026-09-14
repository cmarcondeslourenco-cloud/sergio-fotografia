import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.join(process.cwd(), 'projetos', 'fontes-editoriais-geradas');
const destinationDirectory = path.join(process.cwd(), 'public', 'editorial');
const files = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.png'));

for (const file of files) {
  const source = path.join(sourceDirectory, file);
  const destination = path.join(destinationDirectory, file.replace(/\.png$/i, '.webp'));
  await sharp(source).rotate().webp({ quality: 86, effort: 5 }).toFile(destination);
  process.stdout.write(`Otimizado: ${file} -> ${path.basename(destination)}\n`);
}
