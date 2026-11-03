// Generated as sw.js by node build.mjs. Its asset hash changes on every build change.
const BUILD = 'c547517dd5b1f82a';
const BASE = new URL('./', self.location.href);
const PREFIX = `pwa-weather:${BASE.pathname}:`;
const SHELL = `${PREFIX}shell:${BUILD}`;
const WEATHER = `${PREFIX}weather:v1`;
const ASSETS = ["index.html","styles.css","app.js","weather.mjs","pwa.mjs","manifest.webmanifest","icon.svg","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-180.png"];
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, BASE).href));
const INDEX = new URL('index.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(ASSETS.map(path => new Request(new URL(path, BASE), {cache:'reload'})));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== SHELL && name !== WEATHER).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function shellResponse(request, key) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request, {cache:'no-cache'});
    if (!response.ok) throw new Error('Asset unavailable');
    await cache.put(key, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await cache.match(key);
    return cached || new Response('Weather could not load. Reconnect and try again.', {status:503, headers:{'Content-Type':'text/plain'}});
  }
}
async function weatherResponse(request) {
  const cache = await caches.open(WEATHER);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(request, {signal:controller.signal, cache:'no-store'});
    if (!response.ok) throw new Error('Forecast unavailable');
    // Never replace usable weather with an error JSON or an empty response.
    const data = await response.clone().json();
    if (!data.current || !Number.isFinite(data.current.time)) throw new Error('Invalid forecast');
    if (new URL(request.url).pathname === '/v1/forecast' && (!Number.isFinite(data.current.temperature_2m) || !Array.isArray(data.hourly?.time) || !Array.isArray(data.daily?.time))) throw new Error('Incomplete forecast');
    await cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await cache.match(request);
    if (!cached) return new Response('{"error":true}', {status:503, headers:{'Content-Type':'application/json'}});
    const headers = new Headers(cached.headers);
    headers.set('X-Weather-Cache', 'saved');
    return new Response(await cached.arrayBuffer(), {status:200, headers});
  } finally { clearTimeout(timer); }
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const weatherApi = (url.origin === 'https://api.open-meteo.com' && url.pathname === '/v1/forecast') ||
    (url.origin === 'https://air-quality-api.open-meteo.com' && url.pathname === '/v1/air-quality');
  if (weatherApi) {
    event.respondWith(weatherResponse(request));
    return;
  }
  if (url.origin !== BASE.origin) return;
  url.search = '';
  url.hash = '';
  if (request.mode === 'navigate' && (url.href === BASE.href || url.href === INDEX)) {
    event.respondWith(shellResponse(request, INDEX));
  } else if (ASSET_URLS.has(url.href)) {
    event.respondWith(shellResponse(request, url.href));
  }
});
