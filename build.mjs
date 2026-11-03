import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const assets = [
  'index.html', 'styles.css', 'app.js', 'weather.mjs', 'pwa.mjs',
  'manifest.webmanifest', 'icon.svg',
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
for (const asset of [...assets, 'sw.js']) {
  await copyFile(new URL(asset, root), new URL(asset, output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Packaged installable weather app in docs/ with a versioned service worker.');
