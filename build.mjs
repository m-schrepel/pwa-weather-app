import { copyFile, mkdir, writeFile } from 'node:fs/promises';

// This prototype is already static HTML/CSS/JS. Package only public assets.
const assets = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
];
const output = new URL('./html/', import.meta.url);
await mkdir(output, { recursive: true });
for (const asset of assets) {
  await copyFile(new URL(asset, import.meta.url), new URL(asset, output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Packaged static weather app in html/');
