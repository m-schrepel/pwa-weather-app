import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {inflateSync} from 'node:zlib';
import {fetchJson,normalizeForecast} from './weather.mjs';

const source = await readFile(new URL('./sw.js',import.meta.url),'utf8');
function worker() {
  const listeners = new Map(), stores = new Map();
  let online = true, broken = false, skips = 0;
  const key = request => typeof request === 'string' ? request : request.url;
  const cache = name => {
    if (!stores.has(name)) stores.set(name,new Map());
    const store = stores.get(name);
    return {
      async match(request) {return store.get(key(request))?.clone();},
      async put(request,response) {store.set(key(request),response.clone());},
      async addAll(requests) {for (const request of requests) store.set(key(request),new Response('app shell'));},
    };
  };
  const self = {location:{href:'https://example.com/pwa-weather-app/sw.js'},clients:{claim:async()=>{}},skipWaiting:()=>{skips++;},addEventListener:(name,callback)=>listeners.set(name,callback)};
  const caches = {open:async name=>cache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
  const fetch = async request => {
    if (!online) throw new Error('offline');
    if (broken) return new Response('{"current":{"time":123}}',{headers:{'Content-Type':'application/json'}});
    if (key(request).includes('open-meteo.com')) return new Response(JSON.stringify({current:{time:123,temperature_2m:50},hourly:{time:[123]},daily:{time:[123]}}),{headers:{'Content-Type':'application/json'}});
    return new Response('fresh shell');
  };
  vm.runInNewContext(source,{self,caches,fetch,URL,Request,Response,Headers,AbortController,setTimeout,clearTimeout});
  return {
    stores, online:value=>{online=value;}, broken:value=>{broken=value;}, skips:()=>skips,
    async event(name,data={}) {let completion;listeners.get(name)({...data,waitUntil:p=>{completion=p;}});await completion;},
    async request(url,mode='cors',method='GET') {let response;listeners.get('fetch')({request:{url,mode,method},respondWith:p=>{response=p;}});return await response;},
  };
}

test('manifest and PNG icons resolve within the GitHub Pages project path',async()=>{
  const manifest=JSON.parse(await readFile('docs/manifest.webmanifest','utf8'));
  const base='https://example.com/pwa-weather-app/';
  assert.equal(new URL(manifest.start_url,base).pathname,'/pwa-weather-app/');
  assert.equal(new URL(manifest.scope,base).pathname,'/pwa-weather-app/');
  assert.equal(manifest.display,'standalone');
  for(const size of ['192x192','512x512']) assert.ok(manifest.icons.some(icon=>icon.sizes===size&&icon.purpose==='any'));
  assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
  for(const icon of manifest.icons) {
    const bytes=await readFile(new URL(icon.src,new URL('./docs/',import.meta.url)));
    const [width,height]=icon.sizes.split('x').map(Number);
    assert.equal(bytes.readUInt32BE(16),width);assert.equal(bytes.readUInt32BE(20),height);
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    if(icon.purpose==='maskable') {
      let chunks=[],offset=8;
      while(offset<bytes.length){const length=bytes.readUInt32BE(offset);if(bytes.subarray(offset+4,offset+8).toString()==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));offset+=length+12;}
      const pixels=inflateSync(Buffer.concat(chunks));
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(Math.hypot(x+.5-width/2,y+.5-height/2)>width*.4){const at=y*(width*3+1)+1+x*3;assert.deepEqual([...pixels.subarray(at,at+3)],[17,27,27]);}
    }
  }
});
test('worker preloads project assets, serves offline navigation, and ignores unrelated URLs',async()=>{
  const w=worker();await w.event('install');w.online(false);
  const response=await w.request('https://example.com/pwa-weather-app/?source=home','navigate');
  assert.equal(await response.text(),'app shell');
  assert.equal(await w.request('https://example.com/other-project/','navigate'),undefined);
  assert.equal(await w.request('https://example.com/pwa-weather-app/unknown','navigate'),undefined);
  assert.equal(await w.request('https://example.com/pwa-weather-app/index.html','navigate','POST'),undefined);
  const asset=await w.request('https://example.com/pwa-weather-app/weather.mjs');assert.equal(asset.status,200);
});
test('weather is network-first and offline fallbacks carry an explicit saved-data marker',async()=>{
  const w=worker(), url='https://api.open-meteo.com/v1/forecast?latitude=47.716';
  const fresh=await w.request(url);assert.equal(fresh.headers.get('X-Weather-Cache'),null);
  w.online(false);const saved=await w.request(url);assert.equal(saved.headers.get('X-Weather-Cache'),'saved');
  assert.equal((await saved.json()).current.temperature_2m,50);
  const missing=await w.request('https://air-quality-api.open-meteo.com/v1/air-quality');assert.equal(missing.status,503);
});
test('incomplete API responses do not overwrite a valid cached forecast',async()=>{
  const w=worker(),url='https://api.open-meteo.com/v1/forecast';await w.request(url);w.broken(true);
  const response=await w.request(url);assert.equal(response.headers.get('X-Weather-Cache'),'saved');
  assert.equal((await response.json()).current.temperature_2m,50);
});
test('activation only cleans this project’s old caches and updates require a message',async()=>{
  const w=worker();await w.event('install');
  w.stores.set('pwa-weather:/pwa-weather-app/:shell:old',new Map());
  w.stores.set('pwa-weather:/other/:shell:old',new Map());
  await w.event('activate');
  assert.equal(w.stores.has('pwa-weather:/pwa-weather-app/:shell:old'),false);
  assert.equal(w.stores.has('pwa-weather:/other/:shell:old'),true);
  assert.equal(w.skips(),0);await w.event('message',{data:{type:'SKIP_WAITING'}});assert.equal(w.skips(),1);
});
test('the app receives the saved marker rather than treating fallback data as live',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>new Response(JSON.stringify({current:{time:123,temperature_2m:50},hourly:{time:[123]},daily:{time:[123]}}),{headers:{'X-Weather-Cache':'saved','Content-Type':'application/json'}});
    const data=await fetchJson('https://api.open-meteo.com/v1/forecast');assert.equal(data._cached,true);assert.equal(normalizeForecast(data).saved,true);
  }finally{globalThis.fetch=original;}
});
