// Open-Meteo requests use Fahrenheit, mph, inches, and UTC epoch timestamps.
export const LOCATION = Object.freeze({ latitude: 47.716, longitude: -122.211, timezone: 'America/Los_Angeles' });
export const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const probability = value => finite(value) !== null && value >= 0 && value <= 100 ? value : null;
export const rounded = value => finite(value) === null ? '—' : String(Math.round(value));
export function localTime(time, options = {}) {
  return finite(time) === null ? '—' : new Intl.DateTimeFormat('en-US', { timeZone: LOCATION.timezone, ...options }).format(new Date(time * 1000));
}
export const clockTime = time => localTime(time, { hour: 'numeric', minute: '2-digit' });

export function condition(code, isDay = true) {
  const labels = { 0:'Clear skies', 1:'Mostly clear', 2:'Partly cloudy', 3:'Overcast', 45:'Foggy', 48:'Freezing fog', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle', 56:'Freezing drizzle', 57:'Freezing drizzle', 61:'Light rain', 63:'Rain', 65:'Heavy rain', 66:'Freezing rain', 67:'Freezing rain', 71:'Light snow', 73:'Snow', 75:'Heavy snow', 77:'Snow grains', 80:'Light rain showers', 81:'Rain showers', 82:'Heavy rain showers', 85:'Snow showers', 86:'Heavy snow showers', 95:'Thunderstorm', 96:'Thunderstorm with hail', 99:'Thunderstorm with hail' };
  if (!Object.hasOwn(labels, code)) return {label:'Conditions unavailable', icon:'cloud', scene:'cloudy', snowy:false};
  const snowy = [71,73,75,77,85,86].includes(code);
  const wet = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
  return {
    label: !isDay && (code === 0 || code === 1) ? 'Clear night' : labels[code] || 'Conditions unavailable',
    icon: snowy ? 'snow' : code >= 95 ? 'storm' : wet ? 'rain' : code === 45 || code === 48 ? 'fog' : code <= 1 ? (isDay ? 'sun' : 'moon') : 'cloud',
    scene: wet ? 'rain' : code <= 1 ? (isDay ? 'clear' : 'night') : 'cloudy',
    snowy,
  };
}

export function uvCategory(value) {
  if (finite(value) === null) return 'UNAVAILABLE';
  return value < 3 ? 'LOW' : value < 6 ? 'MODERATE' : value < 8 ? 'HIGH' : value < 11 ? 'VERY HIGH' : 'EXTREME';
}
export function aqiCategory(value) {
  if (finite(value) === null || value < 0) return 'UNAVAILABLE';
  return value <= 50 ? 'GOOD' : value <= 100 ? 'MODERATE' : value <= 150 ? 'UNHEALTHY FOR SENSITIVE GROUPS' : value <= 200 ? 'UNHEALTHY' : value <= 300 ? 'VERY UNHEALTHY' : 'HAZARDOUS';
}
export function windDirection(degrees) {
  return finite(degrees) === null ? '—' : ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(((degrees % 360 + 360) % 360) / 22.5) % 16];
}

// The card's percentage is the maximum hourly precipitation probability, not
// a combined probability of rain over the whole window. Timing is approximate.
export function rainOutlook(hours) {
  const chances = hours.map(hour => probability(hour.chance));
  const available = chances.filter(value => value !== null);
  const chance = available.length ? Math.max(...available) : null;
  if (hours.length < 12 || available.length !== hours.length) return { chance, note:'12-hour outlook incomplete' };
  if (chance < 20) return { chance, note:'Mostly dry for the next 12 hours' };
  const threshold = chance >= 50 ? 50 : 20;
  const start = hours.findIndex(hour => hour.chance >= threshold);
  let end = start;
  while (end + 1 < hours.length && hours[end + 1].chance >= threshold) end++;
  const period = hours.slice(start, end + 1);
  const term = period.some(hour => condition(hour.code).snowy) ? 'Snow' : 'Rain';
  const likelihood = threshold === 50 ? 'likely' : 'possible';
  const time = clockTime(hours[start].time);
  const timing = start === 0 ? `through about ${clockTime(hours[end].time + 3600)}` : `around ${time}`;
  return { chance, note:`${term} ${likelihood} ${timing}` };
}

export function normalizeForecast(data) {
  const c = data?.current, h = data?.hourly, d = data?.daily;
  if (!c || finite(c.time) === null || finite(c.temperature_2m) === null || !Array.isArray(h?.time) || !Array.isArray(d?.time) || !d.time.length) throw new Error('Incomplete forecast response');
  const current = { time:c.time, temp:c.temperature_2m, feels:finite(c.apparent_temperature), code:finite(c.weather_code), isDay:c.is_day === 1, wind:finite(c.wind_speed_10m), gust:finite(c.wind_gusts_10m), direction:windDirection(c.wind_direction_10m) };
  let start = h.time.findIndex(time => finite(time) !== null && time > c.time);
  start = start === -1 ? h.time.length : start;
  start = Math.max(0, start - 1);
  const hours = h.time.slice(start, start + 12).map((time, offset) => {
    const i = start + offset;
    return {time:finite(time), temp:finite(h.temperature_2m?.[i]), chance:probability(h.precipitation_probability?.[i]), code:finite(h.weather_code?.[i]), isDay:h.is_day?.[i] === 1};
  });
  if (!hours.length) throw new Error('Hourly forecast unavailable');
  const days = d.time.slice(0,5).map((time,i) => ({time:finite(time), high:finite(d.temperature_2m_max?.[i]), low:finite(d.temperature_2m_min?.[i]), code:finite(d.weather_code?.[i]), chance:probability(d.precipitation_probability_max?.[i])}));
  return {current, hours, days, uv:finite(d.uv_index_max?.[0]), sunrise:finite(d.sunrise?.[0]), sunset:finite(d.sunset?.[0]), outlook:rainOutlook(hours)};
}

export function weatherUrl() {
  const params = new URLSearchParams({latitude:LOCATION.latitude, longitude:LOCATION.longitude, timezone:LOCATION.timezone, temperature_unit:'fahrenheit', wind_speed_unit:'mph', precipitation_unit:'inch', timeformat:'unixtime', forecast_days:'5', current:'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m', hourly:'temperature_2m,precipitation_probability,weather_code,is_day', daily:'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,sunrise,sunset'});
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}
export function airQualityUrl() {
  const params = new URLSearchParams({latitude:LOCATION.latitude, longitude:LOCATION.longitude, timezone:LOCATION.timezone, current:'us_aqi', timeformat:'unixtime'});
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
}
export async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {signal:controller.signal});
    if (!response.ok) throw new Error('Weather service unavailable');
    return await response.json();
  } finally { clearTimeout(timer); }
}
