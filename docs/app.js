import { icon } from './weather-icons.mjs';
import { backgroundAssets } from './weather-scenes.mjs';
import { finite, rounded, localTime as formatLocalTime, clockTime as formatClockTime, condition, uvCategory, aqiCategory, normalizeForecast, weatherUrl, airQualityUrl, fetchJson } from './weather.mjs';
import { detectLocation, coordinateLabel, cityName, FALLBACK_LOCATION } from './location.mjs';
const $ = (id) => document.getElementById(id);
let activeLocation = FALLBACK_LOCATION;
let forecastTimezone = FALLBACK_LOCATION.timezone;
let namedLocation = null;
const localTime = (time, options) => formatLocalTime(time, options, forecastTimezone);
const clockTime = time => formatClockTime(time, forecastTimezone);


// Only allowlisted, pre-generated local files can become image URLs.
function renderBackgrounds(code, isDay) {
  const paths = backgroundAssets(code, isDay);
  const fallback = backgroundAssets(null, isDay);
  for (const [id, key] of [['landscape','landscape'], ['weather-layer','atmosphere']]) {
    const host = $(id);
    let img = host.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      host.replaceChildren(img);
    }
    const url = new URL(paths[key], import.meta.url).href;
    img.onerror = () => {
      const backup = new URL(fallback[key], import.meta.url).href;
      if (img.src !== backup) img.src = backup;
      else img.remove();
    };
    if (img.src !== url) img.src = url;
  }
}

function setValues(values) {
  for (const [id, value] of Object.entries(values)) $(id).textContent = value;
}
function renderWeather(data) {
  forecastTimezone = data.timezone;
  const {current:c, hours, days, outlook} = data;
  const view = condition(c.code, c.isDay), mode = view.scene;
  const saved = data.saved || Date.now() / 1000 - c.time > 3 * 3600;
  document.querySelector('main').dataset.weather = mode;
  document.querySelector('main').dataset.period = c.isDay ? 'day' : 'night';
  setValues({
    'current-title':view.label, 'current-temp':rounded(c.temp), high:`${rounded(days[0].high)}°`, low:`${rounded(days[0].low)}°`, feels:`${rounded(c.feels)}°`,
    'rain-value':rounded(outlook.chance), 'rain-note':saved ? `Saved: ${outlook.note.toLowerCase()}` : outlook.note, 'wind-value':rounded(c.wind), 'wind-direction':c.direction, 'gust-value':`${rounded(c.gust)} mph`,
    'uv-value':finite(data.uv) === null ? '—' : data.uv.toFixed(1), 'uv-label':uvCategory(data.uv),
    'wind-status':c.gust === null ? 'Gust data unavailable' : c.gust >= 25 ? '≋ Gusty at times' : c.wind !== null && c.wind < 1 ? 'Calm' : '≋ No strong gusts',
  });
  $('rain-meter').style.width = `${outlook.chance ?? 0}%`;
  $('rain-card').title = 'Maximum hourly precipitation probability in the next 12 hours';
  renderBackgrounds(c.code, c.isDay);
  $('landscape').setAttribute('aria-label', `Watercolor illustration: ${view.label.toLowerCase()} over Moss Bay from the Marina Park pavilion area in Kirkland`);
  $('hourly').innerHTML = hours.map((hour,i) => `<div class="hour"><span class="time">${i === 0 && !saved ? 'NOW' : localTime(hour.time,{hour:'numeric'}).replace(' ','')}</span>${icon(condition(hour.code,hour.isDay).icon)}<span class="hour-temp">${rounded(hour.temp)}°</span><span class="rain-chance" aria-label="${rounded(hour.chance)} percent chance of precipitation">${rounded(hour.chance)}%</span></div>`).join('');
  $('daily').innerHTML = days.map((day,i) => {
    const name = i === 0 && !saved ? 'Today' : localTime(day.time,{weekday:'short'});
    return `<article class="day-card" aria-label="${name}: high ${rounded(day.high)}, low ${rounded(day.low)} degrees Fahrenheit, ${rounded(day.chance)} percent chance of precipitation"><h3>${name}</h3>${icon(condition(day.code).icon)}<div class="day-temperatures"><span class="day-high">${rounded(day.high)}°</span><span class="day-low">${rounded(day.low)}°</span></div><span class="day-rain">${rounded(day.chance)}% precip</span></article>`;
  }).join('');
  for (const name of ['sunrise','sunset']) {
    $(name).textContent = clockTime(data[name]);
  }
  const uvLevel = data.uv === null ? -1 : data.uv < 3 ? 0 : data.uv < 6 ? 1 : data.uv < 8 ? 2 : data.uv < 11 ? 3 : 4;
  document.querySelector('.uv-meter').dataset.level = uvLevel;
}
function renderAirQuality(data) {
  const current = data?.current;
  const value = finite(current?.us_aqi);
  const aqi = value !== null && value >= 0 ? Math.round(value) : null;
  const label = aqiCategory(aqi);
  setValues({'aqi-value':rounded(aqi), 'aqi-label':label, 'aqi-note':aqi === null ? 'Air quality unavailable' : `${data?._cached ? 'Saved AQI' : 'US AQI model'} · ${data?._cached ? localTime(current.time,{month:'short',day:'numeric'}) + ' ' : ''}${clockTime(current.time)}`});
  const thresholds = [50,100,150,200,300];
  const level = aqi === null ? -1 : thresholds.findIndex(limit => aqi <= limit);
  document.querySelector('.aqi-meter').dataset.level = aqi === null ? -1 : level === -1 ? 5 : level;
}

let lastWeather = null;
let loading = false;
let nextRefresh;
let lastAttempt = 0;
function clearForecast() {
  lastWeather = null;
  document.querySelector('main').dataset.period = 'day';
  for (const id of ['current-temp','high','low','feels','rain-value','wind-value','wind-direction','gust-value','uv-value','uv-label','sunrise','sunset']) $(id).textContent = '—';
  setValues({'current-title':'Loading weather…', 'rain-note':'Next 12 hours', 'wind-status':'Loading wind…', hourly:'Loading hourly forecast…', daily:'Loading daily forecast…'});
  $('rain-meter').style.width = '0%';
  document.querySelector('.uv-meter').dataset.level = -1;
  renderAirQuality(null);
  renderBackgrounds(null, true);
}

async function loadWeather() {
  if (loading || document.hidden) return;
  clearTimeout(nextRefresh);
  loading = true;
  lastAttempt = Date.now();
  $('use-location').disabled = true;
  $('location-detail').textContent = 'Finding your location…';
  const detected = await detectLocation();
  if (detected.location) {
    const next = detected.location;
    if (next.latitude !== activeLocation.latitude || next.longitude !== activeLocation.longitude) clearForecast();
    activeLocation = next;
  }
  const isDevice = !activeLocation.name;
  const locationKey = `${activeLocation.latitude},${activeLocation.longitude}`;
  const city = namedLocation?.key === locationKey ? namedLocation.name : null;
  $('location-name').textContent = city || (isDevice ? detected.error ? 'Last known location' : 'Current location' : activeLocation.name);
  $('location-detail').textContent = detected.error
    ? `${detected.error} ${isDevice ? 'Using the last detected location.' : 'Showing Kirkland as a fallback.'}`
    : city ? 'Current location' : coordinateLabel(activeLocation);
  document.title = `${city || (isDevice ? 'Current location' : activeLocation.name)} · Weather`;
  if (detected.location && !city) {
    void cityName(activeLocation).then(name => {
      if (!name || `${activeLocation.latitude},${activeLocation.longitude}` !== locationKey) return;
      namedLocation = {key:locationKey, name};
      $('location-name').textContent = name;
      $('location-detail').textContent = 'Current location';
      document.title = `${name} · Weather`;
    });
  }
  $('data-status').textContent = 'UPDATING';
  $('data-status').removeAttribute('aria-label');
  $('load-message').textContent = `Fetching weather for ${isDevice ? 'your location' : activeLocation.name}…`;
  let pulledAt;
  const [weather, air] = await Promise.allSettled([
    fetchJson(weatherUrl(activeLocation)).then(data => {
      pulledAt = Date.now() / 1000;
      return normalizeForecast(data);
    }), fetchJson(airQualityUrl(activeLocation)),
  ]);
  if (weather.status === 'fulfilled') {
    lastWeather = weather.value;
    renderWeather(lastWeather);
    renderAirQuality(air.status === 'fulfilled' ? air.value : null);
    const age = Date.now() / 1000 - lastWeather.current.time;
    $('data-status').textContent = lastWeather.saved ? 'SAVED FORECAST' : age > 3 * 3600 ? 'OLDER FORECAST' : `FORECAST AS OF ${clockTime(pulledAt)}`;
    const validTime = `Forecast valid ${localTime(lastWeather.current.time,{month:'short',day:'numeric',year:'numeric'})}, ${clockTime(lastWeather.current.time)} · ${forecastTimezone}`;
    $('data-status').title = validTime;
    $('data-status').setAttribute('aria-label', `${$('data-status').textContent}. ${validTime}`);
    $('load-message').textContent = lastWeather.saved ? 'Showing a saved forecast. Updates resume when connected.' : air.status === 'fulfilled' && finite(air.value?.current?.us_aqi) !== null ? 'Local forecast updated.' : 'Weather updated. Air quality is unavailable; retrying automatically.';
  } else {
    $('data-status').textContent = 'UPDATE FAILED';
    $('load-message').textContent = lastWeather ? 'Could not refresh. Showing the previous forecast.' : 'Could not load weather. Updates will retry automatically.';
    if (!lastWeather) {
      $('current-title').textContent = 'Weather unavailable';
      $('hourly').textContent = 'Hourly forecast unavailable.';
      $('daily').textContent = 'Daily forecast unavailable.';
      renderAirQuality(null);
    }
  }
  loading = false;
  $('use-location').disabled = false;
  nextRefresh = setTimeout(loadWeather, weather.status === 'fulfilled' && !lastWeather.saved && air.status === 'fulfilled' && finite(air.value?.current?.us_aqi) !== null ? 15 * 60_000 : 60_000);
}
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
$('use-location').addEventListener('click', loadWeather);
window.addEventListener('online', loadWeather);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() - lastAttempt >= 60_000) loadWeather();
});
clearForecast();
loadWeather();
