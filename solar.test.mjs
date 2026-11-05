import test from 'node:test';
import assert from 'node:assert/strict';
import {solarPosition, solarDay, clearSkyLight} from './solar.mjs';
const kirkland={latitude:47.716,longitude:-122.211};

test('solar angles agree with the published NREL SPA example within the simpler model tolerance',()=>{
  // Reda/Andreas SPA report example: 2003-10-17 12:30:30 MST, Boulder.
  // SPA zenith 50.11162°, azimuth 194.34024°. Our model omits parallax/elevation.
  const p=solarPosition(Date.parse('2003-10-17T19:30:30Z'),{latitude:39.742476,longitude:-105.1786});
  assert.ok(Math.abs(p.apparentElevation-(90-50.11162))<.1,JSON.stringify(p));
  assert.ok(Math.abs(p.azimuth-194.34024)<.1);
});
test('day bounds honor local date, DST, seasonal geometry and horizon crossings',()=>{
  const fall=solarDay('2026-11-05',kirkland,'America/Los_Angeles');
  assert.ok(fall.sunrise<fall.noon && fall.noon<fall.sunset);
  for(const time of [fall.sunrise,fall.sunset])assert.ok(Math.abs(solarPosition(time,kirkland).elevation+.833)<.0001);
  assert.ok(solarPosition(fall.sunrise,kirkland).azimuth<180);
  assert.ok(solarPosition(fall.sunset,kirkland).azimuth>180);
  assert.ok(fall.maxElevation>25 && fall.maxElevation<28);
  const summer=solarDay('2026-06-21',kirkland,'America/Los_Angeles');
  assert.ok(summer.maxElevation>65);
  assert.ok(summer.sunset-summer.sunrise>fall.sunset-fall.sunrise);
  assert.equal(solarDay('2026-03-08',kirkland,'America/Los_Angeles').end-solarDay('2026-03-08',kirkland,'America/Los_Angeles').start,23*3600000);
  assert.equal(solarDay('2026-11-01',kirkland,'America/Los_Angeles').end-solarDay('2026-11-01',kirkland,'America/Los_Angeles').start,25*3600000);
});
test('polar days and nights do not invent sunrise or sunset',()=>{
  for(const date of ['2026-06-21','2026-12-21']){
    const day=solarDay(date,{latitude:78,longitude:15},'Arctic/Longyearbyen');
    assert.equal(day.sunrise,null);assert.equal(day.sunset,null);
  }
});
test('lighting rises smoothly with sun elevation and reserves warmth for low sun',()=>{
  let previous=clearSkyLight(-6);
  for(let elevation=-5.5;elevation<=90;elevation+=.5){
    const light=clearSkyLight(elevation);
    assert.ok(light.dayBlend>=previous.dayBlend);
    assert.ok(light.exposure>=previous.exposure);
    for(const value of Object.values(light))assert.ok(value>=0&&value<=1);
    previous=light;
  }
  assert.ok(clearSkyLight(2).warmth>clearSkyLight(25).warmth);
  assert.throws(()=>solarPosition(NaN,kirkland),RangeError);
  assert.throws(()=>solarDay('2026-02-31',kirkland,'America/Los_Angeles'),RangeError);
  assert.throws(()=>solarPosition(Date.now(),{latitude:91,longitude:0}),RangeError);
});
