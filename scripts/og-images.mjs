// Makes a 1200x630 JPG share image (og.jpg) from each project's cover, for sites that don't show WebP previews.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
for (const slug of readdirSync('public/images/projects')) {
  const dir = `public/images/projects/${slug}`;
  if (!readdirSync(dir).includes('cover.webp')) continue;
  await sharp(`${dir}/cover.webp`).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 82 }).toFile(`${dir}/og.jpg`);
  console.log('ok', slug);
}
