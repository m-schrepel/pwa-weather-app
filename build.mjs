import { copyFile, mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BACKGROUND_FILES } from './weather-scenes.mjs';
import { generateBackgrounds } from './scripts/generate-backgrounds.mjs';

await generateBackgrounds();

const assets = [
  'index.html', 'styles.css', 'artwork.css', 'app.js', 'weather.mjs', 'location.mjs', 'pwa.mjs',
  'manifest.webmanifest', 'icon.svg', 'weather-scenes.mjs', 'weather-icons.mjs', 'solar.mjs', 'scene-lighting.mjs',
  ...BACKGROUND_FILES,
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/apple-touch-180.png',
];
const root = new URL('./', import.meta.url);
const output = new URL('./docs/', root);
const hash = createHash('sha256');
for (const asset of assets) hash.update(asset).update(await readFile(new URL(asset, root)));
const template = await readFile(new URL('sw-template.js', root), 'utf8');
hash.update(template);
const worker = template.replace('__BUILD_VERSION__', hash.digest('hex').slice(0,16))
  .replace('__ASSET_LIST__', JSON.stringify(assets));
await writeFile(new URL('sw.js', root), worker);
await mkdir(new URL('icons/', output), {recursive:true});
// Remove former review-only pages from the deployment output.
for (const name of ['backgrounds.html', 'gallery.css', 'gallery.mjs']) {
  await unlink(new URL(name, output)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
for (const asset of [...assets, 'sw.js']) {
  await mkdir(new URL('./', new URL(asset, output)), {recursive:true});
  await copyFile(new URL(asset, root), new URL(asset, output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Packaged installable weather app in docs/ with a versioned service worker.');
