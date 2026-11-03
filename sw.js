// Generated as sw.js by node build.mjs. Its asset hash changes on every build change.
const BUILD = '51e9ff324a4bfa94';
const BASE = new URL('./', self.location.href);
const PREFIX = `pwa-weather:${BASE.pathname}:`;
const SHELL = `${PREFIX}shell:${BUILD}`;
const WEATHER = `${PREFIX}weather:v1`;
const ASSETS = ["index.html","styles.css","app.js","weather.mjs","pwa.mjs","manifest.webmanifest","icon.svg","weather-scenes.mjs","assets/weather/wmo-00-day-scene.svg","assets/weather/wmo-00-day-temperature.svg","assets/weather/wmo-00-night-scene.svg","assets/weather/wmo-00-night-temperature.svg","assets/weather/wmo-01-day-scene.svg","assets/weather/wmo-01-day-temperature.svg","assets/weather/wmo-01-night-scene.svg","assets/weather/wmo-01-night-temperature.svg","assets/weather/wmo-02-day-scene.svg","assets/weather/wmo-02-day-temperature.svg","assets/weather/wmo-02-night-scene.svg","assets/weather/wmo-02-night-temperature.svg","assets/weather/wmo-03-day-scene.svg","assets/weather/wmo-03-day-temperature.svg","assets/weather/wmo-03-night-scene.svg","assets/weather/wmo-03-night-temperature.svg","assets/weather/wmo-45-day-scene.svg","assets/weather/wmo-45-day-temperature.svg","assets/weather/wmo-45-night-scene.svg","assets/weather/wmo-45-night-temperature.svg","assets/weather/wmo-48-day-scene.svg","assets/weather/wmo-48-day-temperature.svg","assets/weather/wmo-48-night-scene.svg","assets/weather/wmo-48-night-temperature.svg","assets/weather/wmo-51-day-scene.svg","assets/weather/wmo-51-day-temperature.svg","assets/weather/wmo-51-night-scene.svg","assets/weather/wmo-51-night-temperature.svg","assets/weather/wmo-53-day-scene.svg","assets/weather/wmo-53-day-temperature.svg","assets/weather/wmo-53-night-scene.svg","assets/weather/wmo-53-night-temperature.svg","assets/weather/wmo-55-day-scene.svg","assets/weather/wmo-55-day-temperature.svg","assets/weather/wmo-55-night-scene.svg","assets/weather/wmo-55-night-temperature.svg","assets/weather/wmo-56-day-scene.svg","assets/weather/wmo-56-day-temperature.svg","assets/weather/wmo-56-night-scene.svg","assets/weather/wmo-56-night-temperature.svg","assets/weather/wmo-57-day-scene.svg","assets/weather/wmo-57-day-temperature.svg","assets/weather/wmo-57-night-scene.svg","assets/weather/wmo-57-night-temperature.svg","assets/weather/wmo-61-day-scene.svg","assets/weather/wmo-61-day-temperature.svg","assets/weather/wmo-61-night-scene.svg","assets/weather/wmo-61-night-temperature.svg","assets/weather/wmo-63-day-scene.svg","assets/weather/wmo-63-day-temperature.svg","assets/weather/wmo-63-night-scene.svg","assets/weather/wmo-63-night-temperature.svg","assets/weather/wmo-65-day-scene.svg","assets/weather/wmo-65-day-temperature.svg","assets/weather/wmo-65-night-scene.svg","assets/weather/wmo-65-night-temperature.svg","assets/weather/wmo-66-day-scene.svg","assets/weather/wmo-66-day-temperature.svg","assets/weather/wmo-66-night-scene.svg","assets/weather/wmo-66-night-temperature.svg","assets/weather/wmo-67-day-scene.svg","assets/weather/wmo-67-day-temperature.svg","assets/weather/wmo-67-night-scene.svg","assets/weather/wmo-67-night-temperature.svg","assets/weather/wmo-71-day-scene.svg","assets/weather/wmo-71-day-temperature.svg","assets/weather/wmo-71-night-scene.svg","assets/weather/wmo-71-night-temperature.svg","assets/weather/wmo-73-day-scene.svg","assets/weather/wmo-73-day-temperature.svg","assets/weather/wmo-73-night-scene.svg","assets/weather/wmo-73-night-temperature.svg","assets/weather/wmo-75-day-scene.svg","assets/weather/wmo-75-day-temperature.svg","assets/weather/wmo-75-night-scene.svg","assets/weather/wmo-75-night-temperature.svg","assets/weather/wmo-77-day-scene.svg","assets/weather/wmo-77-day-temperature.svg","assets/weather/wmo-77-night-scene.svg","assets/weather/wmo-77-night-temperature.svg","assets/weather/wmo-80-day-scene.svg","assets/weather/wmo-80-day-temperature.svg","assets/weather/wmo-80-night-scene.svg","assets/weather/wmo-80-night-temperature.svg","assets/weather/wmo-81-day-scene.svg","assets/weather/wmo-81-day-temperature.svg","assets/weather/wmo-81-night-scene.svg","assets/weather/wmo-81-night-temperature.svg","assets/weather/wmo-82-day-scene.svg","assets/weather/wmo-82-day-temperature.svg","assets/weather/wmo-82-night-scene.svg","assets/weather/wmo-82-night-temperature.svg","assets/weather/wmo-85-day-scene.svg","assets/weather/wmo-85-day-temperature.svg","assets/weather/wmo-85-night-scene.svg","assets/weather/wmo-85-night-temperature.svg","assets/weather/wmo-86-day-scene.svg","assets/weather/wmo-86-day-temperature.svg","assets/weather/wmo-86-night-scene.svg","assets/weather/wmo-86-night-temperature.svg","assets/weather/wmo-95-day-scene.svg","assets/weather/wmo-95-day-temperature.svg","assets/weather/wmo-95-night-scene.svg","assets/weather/wmo-95-night-temperature.svg","assets/weather/wmo-96-day-scene.svg","assets/weather/wmo-96-day-temperature.svg","assets/weather/wmo-96-night-scene.svg","assets/weather/wmo-96-night-temperature.svg","assets/weather/wmo-97-day-scene.svg","assets/weather/wmo-97-day-temperature.svg","assets/weather/wmo-97-night-scene.svg","assets/weather/wmo-97-night-temperature.svg","assets/weather/wmo-99-day-scene.svg","assets/weather/wmo-99-day-temperature.svg","assets/weather/wmo-99-night-scene.svg","assets/weather/wmo-99-night-temperature.svg","assets/weather/unknown-day-scene.svg","assets/weather/unknown-day-temperature.svg","assets/weather/unknown-night-scene.svg","assets/weather/unknown-night-temperature.svg","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-180.png"];
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
