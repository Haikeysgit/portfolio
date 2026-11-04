// Converts every PNG under public/images/projects to WebP (max 1600px wide) and deletes the PNG.
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const f of walk('public/images/projects').filter((f) => f.endsWith('.png'))) {
  await sharp(f).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(f.replace(/\.png$/, '.webp'));
  unlinkSync(f);
}
