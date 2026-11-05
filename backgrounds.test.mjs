import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {WEATHER_CONDITIONS,BACKGROUND_FILES,backgroundAssets,weatherIconType} from './weather-scenes.mjs';
import {icon,ICON_TYPES} from './weather-icons.mjs';
import {condition} from './weather.mjs';
const codes=[0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99];
const readLayer=(code,day=true)=>readFile(new URL(backgroundAssets(code,day).atmosphere,import.meta.url),'utf8');

test('all weather codes compose a shared canvas with a local layer, identically packaged in docs',async()=>{
  assert.deepEqual(WEATHER_CONDITIONS.map(item=>item.code),codes);
  assert.equal(BACKGROUND_FILES.length,62); // Two canvases and 30 × two weather layers.
  for(const code of [...codes,null])for(const day of [true,false]){
    const paths=backgroundAssets(code,day);
    assert.equal(paths.landscape,backgroundAssets(null,day).landscape);
    const layer=await readLayer(code,day);
    assert.match(layer,/viewBox="0 0 320 680"/);
    assert.ok(layer.includes(`data-weather-code="${code??'unknown'}"`));
    assert.ok(layer.includes(`data-period="${day?'day':'night'}"`));
    assert.doesNotMatch(layer,/<script|<foreignObject|<filter|<animate|(?:href|src)="https?:|crispEdges/i);
  }
  let bytes=0;
  for(const path of BACKGROUND_FILES){
    const source=await readFile(path),built=await readFile('docs/'+path);
    assert.deepEqual(built,source);bytes+=source.length;
    if(path.endsWith('.jpg'))assert.equal(source.readUInt16BE(0),0xffd8);
  }
  assert.ok(bytes<1_000_000,`Artwork should remain below 1 MB, got ${bytes}`);
});
test('unknown and hostile inputs use a neutral layer without inventing weather',async()=>{
  const fallback=backgroundAssets(null,true);
  for(const input of [-1,999,NaN,Infinity,'../../secret','3',undefined]){
    assert.deepEqual(backgroundAssets(input,true),fallback);
    assert.equal(weatherIconType(input),'unknown');
  }
  assert.notDeepEqual(backgroundAssets(null,false),fallback);
  const unknown=await readLayer(null);
  assert.doesNotMatch(unknown,/data-layer="(?:sun|moon|stars|clouds|rain|snow|fog|lightning)"/);
});
test('sun, moon and cloud composition follows each day/night sky state',async()=>{
  for(const code of [...codes,null])assert.doesNotMatch(await readLayer(code,false),/data-layer="sun"/);
  for(const code of [3,45,48,61,73,95])assert.doesNotMatch(await readLayer(code),/data-layer="sun|data-layer="moon|data-layer="stars/);
  const day=await readLayer(0),night=await readLayer(0,false);
  assert.match(day,/data-layer="sun"/);assert.doesNotMatch(day,/data-layer="clouds"/);
  assert.match(night,/data-layer="moon"/);assert.match(night,/data-layer="stars"/);
  assert.match(await readLayer(2,false),/data-layer="clouds"/);
  assert.match(await readLayer(3,false),/data-layer="cloud-cover"/);
});
test('fog, freezing precipitation, snow, storms and hail retain distinct layers and intensity',async()=>{
  for(const day of [true,false])for(const [code,layer] of [[45,'fog'],[48,'frost'],[56,'ice'],[66,'ice'],[71,'snow'],[77,'snow'],[95,'lightning'],[97,'lightning'],[99,'hail']]){
    assert.ok((await readLayer(code,day)).includes(`data-layer="${layer}"`),`${code}/${day} missing ${layer}`);
  }
  for(const [light,heavy] of [[51,55],[61,65],[71,75],[96,99]]){
    assert.ok((await stat(backgroundAssets(heavy).atmosphere)).size>(await stat(backgroundAssets(light).atmosphere)).size);
  }
  assert.equal(condition(97).label,'Heavy thunderstorm');
  assert.equal(condition(99).icon,'hail');
});
test('watercolor icons support all codes and periods, with distinct freezing-rain and hail symbols',()=>{
  for(const code of codes)for(const day of [true,false]){
    const type=weatherIconType(code,day);
    assert.ok(ICON_TYPES.includes(type));assert.notEqual(type,'unknown');
    assert.match(icon(type),/viewBox="0 0 32 32"/);
    assert.doesNotMatch(icon(type),/crispEdges|class="hatch"/);
  }
  assert.equal(weatherIconType(0,false),'moon');
  assert.equal(weatherIconType(2,false),'partly-cloudy-night');
  assert.equal(weatherIconType(56),'freezing-rain');
  assert.equal(weatherIconType(99),'hail');
  assert.match(icon('<script>'),/data-glyph="unknown"/);
  assert.doesNotMatch(icon('<script>'),/<script>/);
});
test('every artwork asset and the icon renderer is available offline; review pages stay out',async()=>{
  const worker=await readFile('docs/sw.js','utf8');
  for(const path of [...BACKGROUND_FILES,'weather-scenes.mjs','weather-icons.mjs','artwork.css'])assert.ok(worker.includes(`"${path}"`),path);
  for(const path of ['backgrounds.html','gallery.css','gallery.mjs'])assert.ok(!worker.includes(`"${path}"`));
  assert.doesNotMatch(await readFile('artwork.css','utf8'),/animation\s*:|transition\s*:/i);
});
