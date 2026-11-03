import { backgroundAssets } from './weather-scenes.mjs';
import { finite, rounded, localTime, clockTime, condition, uvCategory, aqiCategory, normalizeForecast, weatherUrl, airQualityUrl, fetchJson } from './weather.mjs';
const $ = (id) => document.getElementById(id);


function icon(type) {
  const paths = {
    sun:'<g fill="#d4b77b"><path d="M10 0h4v4h-4zM10 20h4v4h-4zM0 10h4v4H0zM20 10h4v4h-4zM3 3h3v3H3zM18 3h3v3h-3zM3 18h3v3H3zM18 18h3v3h-3zM8 6h8v2h2v8h-2v2H8v-2H6V8h2z"/></g>',
    cloud:'<path fill="#a7bcad" d="M5 8h4V5h8v3h3v3h3v8H1v-8h4z"/><path fill="#789a92" d="M1 16h22v3H1z"/>',
    rain:'<path fill="#a7bcad" d="M5 4h4V1h8v3h3v3h3v7H1V7h4z"/><path fill="#8ab6bf" d="M5 16h2v4H5zm7 2h2v5h-2zm7-2h2v4h-2z"/>',
    moon:'<path fill="#c5d7bc" d="M9 2h6v3h-4v8h4v3h6v3h-4v3H8v-3H5v-3H2V8h3V5h4z"/><path fill="#d4b77b" d="M19 3h3v3h-3z"/>',
    wind:'<path fill="#9dc9ac" d="M2 6h14V3h5v3h-2v3H2zm0 6h20v3H2zm4 6h12v3H6z"/>',
    snow:'<path fill="#c5d7bc" d="M10 0h4v7l5-5 3 3-6 6h8v3h-8l6 6-3 3-5-6v7h-4v-7l-5 5-3-3 6-5H0v-4h8L2 5l3-3 5 5z"/>',
    fog:'<path fill="#a7bcad" d="M2 4h20v3H2zm3 6h16v3H5zM1 16h20v3H1z"/>',
    storm:'<path fill="#a7bcad" d="M5 4h4V1h8v3h3v3h3v7H1V7h4z"/><path fill="#d4b77b" d="M11 12h7l-5 5h4L7 24l3-7H6z"/>',
    air:'<path fill="#9dc9ac" d="M1 4h18v3H1zm4 6h18v3H5zM1 16h18v3H1z"/>'
  };
  return `<svg class="weather-icon" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges">${paths[type] || paths.cloud}</svg>`;
}

// Only allowlisted, pre-generated local files can become image URLs.
function renderBackgrounds(code, isDay) {
  const paths = backgroundAssets(code, isDay);
  const fallback = backgroundAssets(null, isDay);
  for (const [id, key] of [['landscape','landscape'], ['condition-backdrop','temperature']]) {
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
  const {current:c, hours, days, outlook} = data;
  const view = condition(c.code, c.isDay), mode = view.scene;
  const saved = data.saved || Date.now() / 1000 - c.time > 3 * 3600;
  document.querySelector('main').dataset.weather = mode;
  document.querySelector('.date-stamp').setAttribute('title', 'Forecast valid time · Pacific time');
  setValues({
    'current-title':view.label, 'current-temp':rounded(c.temp), high:`${rounded(days[0].high)}°`, low:`${rounded(days[0].low)}°`, feels:`${rounded(c.feels)}°`,
    'rain-value':rounded(outlook.chance), 'rain-note':saved ? `Saved: ${outlook.note.toLowerCase()}` : outlook.note, 'wind-value':rounded(c.wind), 'wind-direction':c.direction, 'gust-value':`${rounded(c.gust)} mph`,
    'uv-value':finite(data.uv) === null ? '—' : data.uv.toFixed(1), 'uv-label':uvCategory(data.uv),
    'wind-status':c.gust === null ? 'Gust data unavailable' : c.gust >= 25 ? '≋ Gusty at times' : c.wind !== null && c.wind < 1 ? 'Calm' : '≋ No strong gusts',
    'date':localTime(c.time,{weekday:'short',month:'short',day:'2-digit'}).toUpperCase(), clock:clockTime(c.time),
  });
  $('rain-meter').style.width = `${outlook.chance ?? 0}%`;
  $('rain-card').title = 'Maximum hourly precipitation probability in the next 12 hours';
  renderBackgrounds(c.code, c.isDay);
  $('landscape').setAttribute('aria-label', `Pixel art: ${view.label.toLowerCase()} over Lake Washington`);
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
async function loadWeather() {
  if (loading) return;
  loading = true;
  $('refresh').disabled = true;
  $('refresh').textContent = 'Refreshing…';
  $('data-status').textContent = 'UPDATING';
  $('load-message').textContent = 'Fetching Kirkland weather…';
  const [weather, air] = await Promise.allSettled([
    fetchJson(weatherUrl()).then(normalizeForecast), fetchJson(airQualityUrl()),
  ]);
  if (weather.status === 'fulfilled') {
    lastWeather = weather.value;
    renderWeather(lastWeather);
    renderAirQuality(air.status === 'fulfilled' ? air.value : null);
    const age = Date.now() / 1000 - lastWeather.current.time;
    $('data-status').textContent = lastWeather.saved ? 'SAVED FORECAST' : age > 3 * 3600 ? 'OLDER FORECAST' : 'LIVE FORECAST';
    $('updated').textContent = `Forecast valid ${localTime(lastWeather.current.time,{month:'short',day:'numeric',year:'numeric'})}, ${clockTime(lastWeather.current.time)} · Pacific time`;
    $('load-message').textContent = lastWeather.saved ? 'Showing a saved forecast. Reconnect and refresh for current weather.' : air.status === 'fulfilled' && finite(air.value?.current?.us_aqi) !== null ? 'Kirkland forecast updated.' : 'Weather updated. Air quality is unavailable; try refreshing.';
  } else {
    $('data-status').textContent = 'UPDATE FAILED';
    $('load-message').textContent = lastWeather ? 'Could not refresh. Showing the previous forecast and its valid time.' : 'Could not load weather. Check your connection and try again.';
    if (!lastWeather) {
      $('current-title').textContent = 'Weather unavailable';
      $('hourly').textContent = 'Hourly forecast unavailable.';
      $('daily').textContent = 'Daily forecast unavailable.';
      renderAirQuality(null);
    }
  }
  loading = false;
  $('refresh').disabled = false;
  $('refresh').textContent = 'Refresh weather';
}
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
$('refresh').addEventListener('click', loadWeather);
loadWeather();
