import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeForecast, rainOutlook, aqiCategory, uvCategory, condition, windDirection, rounded, localTime, weatherUrl, airQualityUrl, fetchJson} from './weather.mjs';
const start = Date.parse('2026-11-04T06:00:00Z') / 1000; // 10 PM Pacific
const hours = chances => chances.map((chance,i) => ({time:start+i*3600,chance,code:61}));

test('rain summary uses the peak hourly probability and local timing across midnight', () => {
  const result = rainOutlook(hours([0,0,10,70,80,0,0,0,0,0,0,0]));
  assert.equal(result.chance,80);
  assert.match(result.note,/Rain likely around 1:00 AM/);
});
test('rain summary distinguishes dry, possible, ongoing, and missing data', () => {
  assert.equal(rainOutlook(hours(Array(12).fill(5))).note,'Mostly dry for the next 12 hours');
  assert.match(rainOutlook(hours([0,35,...Array(10).fill(0)])).note,/Rain possible around/);
  assert.match(rainOutlook(hours(Array(12).fill(70))).note,/Rain likely through about/);
  assert.equal(rainOutlook(hours([null,...Array(11).fill(0)])).note,'12-hour outlook incomplete');
  assert.equal(rainOutlook(hours(Array(12).fill(null))).chance,null);
  const snow = hours(Array(12).fill(70)).map(h=>({...h,code:73}));
  assert.match(rainOutlook(snow).note,/Snow likely/);
});
test('normalize current-hour selection, nulls, and daily values without shifting time zones', () => {
  const times = Array.from({length:48},(_,i)=>start+i*3600);
  const data = {current:{time:start+2*3600+900,temperature_2m:0,apparent_temperature:null,weather_code:3,is_day:0,wind_direction_10m:360}, hourly:{time:times,temperature_2m:Array(48).fill(42),precipitation_probability:Array(48).fill(0),weather_code:Array(48).fill(3),is_day:Array(48).fill(0)}, daily:{time:[start],temperature_2m_max:[55],temperature_2m_min:[40],precipitation_probability_max:[20],weather_code:[3],uv_index_max:[2.5],sunrise:[start+8*3600],sunset:[null]}};
  const result = normalizeForecast(data);
  assert.equal(result.hours[0].time,start+2*3600);
  assert.equal(result.hours.length,12);
  assert.equal(result.current.temp,0);
  assert.equal(result.current.feels,null);
  assert.equal(result.sunset,null);
  assert.equal(result.days[0].high,55);
  assert.throws(()=>normalizeForecast({}),/Incomplete/);
});
test('AQI and UV categories handle boundaries and missing values', () => {
  assert.equal(aqiCategory(0),'GOOD'); assert.equal(aqiCategory(50),'GOOD');
  assert.equal(aqiCategory(51),'MODERATE'); assert.match(aqiCategory(101),/SENSITIVE/);
  assert.equal(aqiCategory(301),'HAZARDOUS'); assert.equal(aqiCategory(null),'UNAVAILABLE');
  assert.equal(uvCategory(2.9),'LOW'); assert.equal(uvCategory(3),'MODERATE');
  assert.equal(uvCategory(11),'EXTREME'); assert.equal(rounded(null),'—');
});
test('weather code mapping covers snow, fog, storms, night, and unknown codes', () => {
  assert.equal(condition(73).icon,'snow'); assert.equal(condition(45).icon,'fog');
  assert.equal(condition(95).icon,'storm'); assert.equal(condition(61,false).scene,'rain');
  assert.equal(condition(0,false).scene,'night'); assert.equal(condition(3,false).scene,'cloudy');
  assert.equal(condition(null).scene,'cloudy'); assert.equal(windDirection(349),'N');
});
test('local formatting follows Pacific DST and URLs request correct units', () => {
  assert.equal(localTime(Date.parse('2026-11-01T08:00:00Z')/1000,{hour:'numeric'}),'1 AM');
  assert.equal(localTime(Date.parse('2026-11-01T09:00:00Z')/1000,{hour:'numeric'}),'1 AM');
  const url = new URL(weatherUrl());
  assert.equal(url.searchParams.get('temperature_unit'),'fahrenheit');
  assert.equal(url.searchParams.get('wind_speed_unit'),'mph');
  assert.equal(url.searchParams.get('timeformat'),'unixtime');
  assert.equal(new URL(airQualityUrl()).searchParams.get('current'),'us_aqi');
});
test('HTTP errors are rejected instead of displayed as forecast data', async () => {
  const originalFetch = globalThis.fetch;
  try {globalThis.fetch=async()=>({ok:false}); await assert.rejects(fetchJson(weatherUrl()),/unavailable/);}
  finally {globalThis.fetch=originalFetch;}
});
