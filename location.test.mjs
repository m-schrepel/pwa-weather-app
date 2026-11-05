import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as weather from './weather.mjs';
import { backgroundAssets } from './weather-scenes.mjs';
import { detectLocation, coordinateLabel, FALLBACK_LOCATION } from './location.mjs';

test('device location is validated, rounded, and requested with bounded battery-friendly options', async () => {
  let options;
  const result = await detectLocation({getCurrentPosition(success, failure, value) {
    options = value;
    success({coords:{latitude:40.712776, longitude:-74.005974}});
  }});
  assert.deepEqual(result.location, {latitude:40.713, longitude:-74.006, timezone:'auto'});
  assert.equal(coordinateLabel(result.location), '40.713° N, 74.006° W');
  assert.equal(options.enableHighAccuracy, false);
  assert.equal(options.timeout, 10000);
  assert.equal(options.maximumAge, 300000);
  assert.equal(coordinateLabel({latitude:0, longitude:0}), '0.000° N, 0.000° E');
});

test('denied, unavailable, timed-out, invalid, and throwing geolocation return actionable errors', async () => {
  assert.match((await detectLocation(null)).error, /unavailable/);
  for (const [code, pattern] of [[1,/blocked/],[2,/Could not determine/],[3,/timed out/]]) {
    assert.match((await detectLocation({getCurrentPosition(success, failure) { failure({code}); }})).error, pattern);
  }
  for (const latitude of [NaN, Infinity, 91, '40']) {
    assert.match((await detectLocation({getCurrentPosition(success) { success({coords:{latitude, longitude:0}}); }})).error, /unavailable/);
  }
  assert.match((await detectLocation({getCurrentPosition() { throw new Error(); }})).error, /unavailable/);
});

test('both weather APIs use device coordinates and timezone; invalid coordinates never form requests', () => {
  for (const makeUrl of [weather.weatherUrl, weather.airQualityUrl]) {
    const url = new URL(makeUrl({latitude:-33.869, longitude:151.209, timezone:'auto'}));
    assert.equal(url.searchParams.get('latitude'), '-33.869');
    assert.equal(url.searchParams.get('longitude'), '151.209');
    assert.equal(url.searchParams.get('timezone'), 'auto');
    assert.throws(() => makeUrl({latitude:91, longitude:0}), /Invalid location/);
  }
  assert.equal(weather.localTime(0, {hour:'numeric'}, 'Asia/Tokyo'), '9 AM');
  assert.match(weather.rainOutlook(Array.from({length:12}, (_,i) => ({time:i*3600, chance:i===1?80:0, code:61})), 'Asia/Tokyo').note, /10:00 AM/);
});

const now = Date.now() / 1000;
const forecast = timezone => ({timezone, current:{time:now, temperature_2m:55, is_day:1}, hourly:{time:[now]}, daily:{time:[now]}});
async function appHarness(detected) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {textContent:'', dataset:{}, style:{}, setAttribute(){}, removeAttribute(){}, addEventListener(){}, querySelector(){return {src:''};}});
    return elements.get(id);
  };
  const requests = [];
  let detection = detected, broken = false;
  const context = vm.createContext({...weather, backgroundAssets, formatLocalTime:weather.localTime, formatClockTime:weather.clockTime,
    detectLocation:async () => detection, coordinateLabel, FALLBACK_LOCATION,
    fetchJson:async url => {
      requests.push(new URL(url));
      if (broken) throw new Error('offline');
      return url.includes('/air-quality') ? {current:{time:now, us_aqi:20}} : forecast(detection.location ? 'Asia/Tokyo' : 'America/Los_Angeles');
    },
    document:{hidden:false, getElementById:element, querySelector:element, querySelectorAll:()=>[], addEventListener(){}},
    window:{addEventListener(){}}, setTimeout:()=>1, clearTimeout(){}, URL, Date,
  });
  const source = (await readFile('app.js','utf8')).replace(/^import .*;\n/gm, '').replaceAll('import.meta.url', "'https://example.com/app.js'");
  vm.runInContext(source, context);
  // Drain the startup call and its fulfilled/rejected API promises.
  await new Promise(resolve => setImmediate(resolve));
  return {element, requests, async refresh(next, fail=false) {
    detection = next; broken = fail;
    await vm.runInContext('loadWeather()', context);
  }};
}

test('home screen falls back explicitly, retries device location, and clears old weather when moving', async () => {
  const app = await appHarness({error:'Location access blocked.'});
  assert.equal(app.element('location-name').textContent, 'Kirkland, WA');
  assert.match(app.element('location-detail').textContent, /fallback/);
  assert.equal(app.requests[0].searchParams.get('latitude'), '47.716');
  await app.refresh({location:{latitude:35.676, longitude:139.65, timezone:'auto'}});
  assert.equal(app.element('location-name').textContent, 'Current location');
  assert.match(app.element('location-detail').textContent, /35.676° N, 139.650° E/);
  assert.equal(app.requests.at(-1).searchParams.get('longitude'), '139.65');
  assert.match(app.element('data-status').title, /Asia\/Tokyo/);
  assert.equal(app.element('current-temp').textContent, '55');
  await app.refresh({location:{latitude:40.713, longitude:-74.006, timezone:'auto'}}, true);
  assert.equal(app.element('current-temp').textContent, '—');
  assert.equal(app.element('current-title').textContent, 'Weather unavailable');
  assert.equal(app.element('use-location').disabled, false);
  await app.refresh({error:'Location request timed out.'});
  assert.equal(app.element('location-name').textContent, 'Last known location');
  assert.equal(app.requests.at(-1).searchParams.get('longitude'), '-74.006');
});
