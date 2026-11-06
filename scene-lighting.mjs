import {solarPosition, clearSkyLight} from './solar.mjs';
import {WEATHER_BY_CODE} from './weather-scenes.mjs';

// Use the real clock even for saved forecasts: weather may be a snapshot, but
// the sun should not freeze at the last successful weather update.
export function landscapeLight(instant, location, code) {
  const position=solarPosition(instant,location);
  const light=clearSkyLight(position.elevation);
  const kind=WEATHER_BY_CODE[code]?.kind;
  const open=['clear','mostly-clear','partly-cloudy'].includes(kind);
  const relative=((position.azimuth-270+540)%360)-180;
  const glowX=50+Math.tan(relative*Math.PI/180)/Math.tan(Math.PI/3)*50;
  return {
    ...light,
    warmth:light.warmth*(open?1:.15),
    glowX:Math.max(0,Math.min(100,glowX)),
    glow:Math.abs(relative)<60 && open?light.warmth:0,
    isDay:position.elevation>=-.833,
    period:light.dayBlend<.55?'night':'day',
  };
}
