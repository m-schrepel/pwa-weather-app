// All weather codes currently documented by Open-Meteo, including code 97.
// Each code has its own composable weather layer over a shared day/night landscape.
export const WEATHER_CONDITIONS = Object.freeze([
  {code:0, label:'Clear skies', kind:'clear', intensity:0, icon:'sun'},
  {code:1, label:'Mostly clear', kind:'mostly-clear', intensity:0, icon:'sun'},
  {code:2, label:'Partly cloudy', kind:'partly-cloudy', intensity:0, icon:'cloud'},
  {code:3, label:'Overcast', kind:'overcast', intensity:0, icon:'cloud'},
  {code:45, label:'Foggy', kind:'fog', intensity:1, icon:'fog'},
  {code:48, label:'Freezing fog', kind:'freezing-fog', intensity:2, icon:'fog'},
  {code:51, label:'Light drizzle', kind:'drizzle', intensity:1, icon:'rain'},
  {code:53, label:'Drizzle', kind:'drizzle', intensity:2, icon:'rain'},
  {code:55, label:'Heavy drizzle', kind:'drizzle', intensity:3, icon:'rain'},
  {code:56, label:'Light freezing drizzle', kind:'freezing-drizzle', intensity:1, icon:'rain'},
  {code:57, label:'Heavy freezing drizzle', kind:'freezing-drizzle', intensity:3, icon:'rain'},
  {code:61, label:'Light rain', kind:'rain', intensity:1, icon:'rain'},
  {code:63, label:'Rain', kind:'rain', intensity:2, icon:'rain'},
  {code:65, label:'Heavy rain', kind:'rain', intensity:3, icon:'rain'},
  {code:66, label:'Light freezing rain', kind:'freezing-rain', intensity:1, icon:'rain'},
  {code:67, label:'Heavy freezing rain', kind:'freezing-rain', intensity:3, icon:'rain'},
  {code:71, label:'Light snow', kind:'snow', intensity:1, icon:'snow'},
  {code:73, label:'Snow', kind:'snow', intensity:2, icon:'snow'},
  {code:75, label:'Heavy snow', kind:'snow', intensity:3, icon:'snow'},
  {code:77, label:'Snow grains', kind:'snow-grains', intensity:2, icon:'snow'},
  {code:80, label:'Light rain showers', kind:'rain-showers', intensity:1, icon:'rain'},
  {code:81, label:'Rain showers', kind:'rain-showers', intensity:2, icon:'rain'},
  {code:82, label:'Heavy rain showers', kind:'rain-showers', intensity:3, icon:'rain'},
  {code:85, label:'Snow showers', kind:'snow-showers', intensity:1, icon:'snow'},
  {code:86, label:'Heavy snow showers', kind:'snow-showers', intensity:3, icon:'snow'},
  {code:95, label:'Thunderstorm', kind:'thunderstorm', intensity:1, icon:'storm'},
  {code:96, label:'Thunderstorm with hail', kind:'hail', intensity:1, icon:'storm'},
  {code:97, label:'Heavy thunderstorm', kind:'thunderstorm', intensity:3, icon:'storm'},
  {code:99, label:'Thunderstorm with heavy hail', kind:'hail', intensity:3, icon:'storm'},
].map(Object.freeze));
export const WEATHER_BY_CODE = Object.freeze(Object.fromEntries(WEATHER_CONDITIONS.map(item=>[item.code,item])));
export function backgroundAssets(code, isDay = true) {
  const known = typeof code === 'number' && Object.hasOwn(WEATHER_BY_CODE,code);
  const key = known ? `wmo-${String(code).padStart(2,'0')}` : 'unknown';
  const variant = isDay ? 'day' : 'night';
  return {
    landscape:`./assets/landscape/pnw-${variant}.jpg`,
    atmosphere:`./assets/weather/${key}-${variant}-weather.svg`,
  };
}
export const BACKGROUND_FILES = Object.freeze([...new Set([...WEATHER_CONDITIONS.map(item=>item.code), null].flatMap(code=>[true,false].flatMap(day=>Object.values(backgroundAssets(code,day)).map(path=>path.slice(2)))))]);

export function weatherIconType(code, isDay = true) {
  const item = typeof code === 'number' ? WEATHER_BY_CODE[code] : null;
  if (!item) return 'unknown';
  if (code === 0) return isDay ? 'sun' : 'moon';
  if (code === 1 || code === 2) return isDay ? 'partly-cloudy' : 'partly-cloudy-night';
  if (item.kind.startsWith('freezing') && !item.kind.includes('fog')) return 'freezing-rain';
  if (item.kind === 'hail') return 'hail';
  return item.icon;
}
