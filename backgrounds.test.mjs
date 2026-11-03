import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {WEATHER_CONDITIONS,BACKGROUND_FILES,backgroundAssets} from './weather-scenes.mjs';
import {condition} from './weather.mjs';
const codes=[0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99];

test('every documented weather code maps to existing day/night assets in source and docs',async()=>{
  assert.deepEqual(WEATHER_CONDITIONS.map(item=>item.code),codes);
  assert.equal(new Set(BACKGROUND_FILES).size,120);
  for(const code of [...codes,null])for(const day of [true,false]) {
    const assets=backgroundAssets(code,day);
    for(const [type,path] of Object.entries(assets)) {
      const source=await readFile(new URL(path,import.meta.url),'utf8');
      const built=await readFile(new URL(path,new URL('./docs/',import.meta.url)),'utf8');
      assert.equal(built,source);
      assert.match(source,/shape-rendering="crispEdges"/);
      assert.ok(source.includes(`viewBox="0 0 320 ${type==='landscape'?680:170}"`));
      assert.ok(source.includes(`data-period="${day?'day':'night'}"`));
      assert.doesNotMatch(source,/<script|<foreignObject|(?:href|src)="https?:/i);
    }
  }
});
test('unknown or hostile inputs only select the neutral fallback assets',()=>{
  const fallback=backgroundAssets(null,true);
  for(const input of [-1,999,NaN,Infinity,'../../secret','3',undefined])assert.deepEqual(backgroundAssets(input,true),fallback);
  assert.notDeepEqual(backgroundAssets(null,false),fallback);
});
test('night and overcast art never draws a sun, while clear nights have moon and stars',async()=>{
  for(const code of [...codes,null]) {
    const assets=backgroundAssets(code,false);
    for(const path of Object.values(assets)) assert.doesNotMatch(await readFile(new URL(path,import.meta.url),'utf8'),/data-layer="sun"/);
  }
  for(const code of [3,45,48,61,73,95]) assert.doesNotMatch(await readFile(new URL(backgroundAssets(code,true).landscape,import.meta.url),'utf8'),/data-layer="sun"/);
  const night=await readFile(new URL(backgroundAssets(0,false).landscape,import.meta.url),'utf8');
  assert.match(night,/data-layer="moon"/);assert.match(night,/data-layer="stars"/);
});
test('fog, ice, snow, and storms have the correct distinct visual layers',async()=>{
  for(const [code,layer] of [[45,'fog'],[48,'frost'],[56,'ice'],[66,'ice'],[71,'snow'],[77,'snow'],[95,'lightning'],[97,'lightning'],[99,'lightning']]) {
    const text=await readFile(new URL(backgroundAssets(code,true).landscape,import.meta.url),'utf8');
    assert.ok(text.includes(`data-layer="${layer}"`),`${code} missing ${layer}`);
  }
  const light=await stat(new URL(backgroundAssets(71,true).landscape,import.meta.url));
  const heavy=await stat(new URL(backgroundAssets(75,true).landscape,import.meta.url));
  assert.ok(heavy.size>light.size);
  assert.equal(condition(97).label,'Heavy thunderstorm');assert.equal(condition(97).icon,'storm');
});
test('service worker includes every asset for offline condition changes',async()=>{
  const worker=await readFile('docs/sw.js','utf8');
  for(const path of BACKGROUND_FILES)assert.ok(worker.includes(`"${path}"`),path);
  assert.ok(worker.includes('"weather-scenes.mjs"'));
  for(const path of ['backgrounds.html','gallery.css','gallery.mjs'])assert.ok(!worker.includes(`"${path}"`),path);
});
