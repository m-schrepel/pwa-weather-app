import { finite, rounded, localTime, clockTime, condition, uvCategory, aqiCategory, normalizeForecast, weatherUrl, airQualityUrl, fetchJson } from './weather.mjs';
const $ = (id) => document.getElementById(id);
const palettes = {
  cloudy: {sky:'#3b5350', horizon:'#5c7461'},
  rain: {sky:'#283c43', horizon:'#47615e'},
  clear: {sky:'#526b61', horizon:'#9d9f70'},
  night: {sky:'#1b2936', horizon:'#37495a'},
};

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

// A wide condition illustration behind the temperature; text supplies its label.
function conditionBackdrop(mode, isDay = true) {
  const cloud = (x, y, fill) => `<path fill="${fill}" d="M${x} ${y+24}h16V${y+12}h24V${y}h46v12h25v12h18v14h14v27H${x}z"/>`;
  let art = '';
  if (mode === 'night') {
    art = '<path fill="#b6c7a6" d="M251 18h28v9h-19v37h19v9h-28v-9h-9V27h9z"/>';
    for (const [x,y] of [[157,22],[192,68],[296,35],[220,105],[121,91],[280,127]]) {
      art += `<path fill="#a8c2b5" d="M${x} ${y}h4v4h-4z"/>`;
    }
    art += cloud(25,107,'#3b5256');
  } else if (mode === 'clear') {
    art = '<g fill="#c1ad72"><path d="M232 28h40v40h-40zM244 10h16v10h-16zM244 76h16v10h-16zM214 40h10v16h-10zM280 40h10v16h-10zM220 16h8v8h-8zM276 16h8v8h-8zM220 72h8v8h-8zM276 72h8v8h-8z"/></g>';
    art += cloud(38,100,'#536c60');
  } else {
    if (mode === 'cloudy' && isDay) art += '<path fill="#a99d69" d="M244 16h32v32h-32zM252 8h16v48h-16z"/>';
    art += cloud(165,38,mode === 'rain' ? '#638284' : '#8c9e85');
    art += cloud(53,88,mode === 'rain' ? '#4f6b71' : '#607e72');
    art += cloud(-66,34,'#3f5c55');
    if (mode === 'rain') {
      for (let i=0; i<12; i++) art += `<path fill="#86abb4" d="M${135+i*14} ${119+(i%3)*11}h3v10h-3z"/>`;
    }
  }
  return `<svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${art}</svg>`;
}

function landscape(mode, s, isDay = true) {
  const rect = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const tree = (x,y,size=1) => `<g transform="translate(${x} ${y}) scale(${size})" fill="#172e2b"><path d="M8 0h4v5h4v6h4v6h4v6H0v-6h4v-6h4z"/><path d="M10 20h4v13h-4z"/></g>`;
  const cloud = (x,y,w,color) => `<path fill="${color}" d="M${x} ${y+6}h12v-6h${w-32}v6h14v6h10v10h-${w+4}V${y+12}h8z"/>`;
  let sky = '';
  if(mode==='night') {
    for(const [x,y] of [[16,15],[41,33],[73,11],[102,29],[144,15],[178,35],[218,18],[284,12],[302,41],[237,44]])sky+=rect(x,y,2,2,'#a4bdaf');
    sky+='<path fill="#d6dfb9" d="M255 16h14v5h-9v17h9v5h-15v-5h-5V21h6z"/>';
  } else {
    if(isDay && (mode==='clear'||mode==='cloudy'))sky+=rect(237,22,24,24,mode==='clear'?'#dbc58b':'#abb38b')+rect(242,17,14,34,mode==='clear'?'#dbc58b':'#abb38b');
    if(mode!=='clear')sky+=cloud(26,20,85,mode==='rain'?'#708886':'#94a391')+cloud(172,43,100,mode==='rain'?'#607b79':'#8c9d8a')+cloud(-17,58,74,'#748d7e');
    else sky+=cloud(30,30,56,'#b4b899')+cloud(163,57,40,'#a3ae8b');
  }
  const mountains='<path d="M0 98V84h18v-6h19V68h22v8h16v9h24v-7h16V65h17v-8h17v11h17v8h20v10h19V75h19V61h17V48h12v8h12v12h16v11h22v9h17v10z" fill="'+(mode==='night'?'#40585c':'#809586')+'"/><path d="M237 61h8V48h12v8h12v12h-12v-7h-8v6h-12z" fill="'+(mode==='night'?'#829794':'#c1c9a9')+'"/>';
  let water='';
  for(let i=0;i<22;i++)water+=rect((i*47+13)%310,105+(i*11)%43,7+(i*13)%26,1,i%3?'#75988a':'#a2b49a');
  let rain='';
  if(mode==='rain')for(let i=0;i<40;i++)rain+=rect((i*37+17)%320,(i*19)%149,1,5,'#96b8bd');
  return `<svg viewBox="0 0 320 680" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">${rect(0,0,320,680,s.sky)}<g transform="translate(0 230)">${sky}</g><g transform="translate(0 470) scale(1 1.36)">${rect(0,76,320,79,s.horizon)}${mountains}${rect(0,99,320,56,mode==='night'?'#2e494a':'#456b61')}${water}<path fill="#294c40" d="M0 92h27v7h23v7h37v6h29v8H0zM320 89h-22v8h-20v6h-24v7h-22v8h88z"/>${tree(-8,65,1.6)}${tree(12,80,1.1)}${tree(285,70,1.6)}${tree(269,85,1)}<path fill="#1b352d" d="M0 137h24v-5h24v6h22v5h31v12H0zM320 131h-18v7h-21v5h-24v12h63z"/>${rain}</g></svg>`;
}

function setValues(values) {
  for (const [id, value] of Object.entries(values)) $(id).textContent = value;
}
function renderWeather(data) {
  const {current:c, hours, days, outlook} = data;
  const view = condition(c.code, c.isDay), mode = view.scene;
  const saved = data.saved || Date.now() / 1000 - c.time > 3 * 3600;
  const palette = c.isDay ? palettes[mode] : palettes.night;
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
  $('condition-backdrop').innerHTML = conditionBackdrop(mode, c.isDay && c.code <= 2);
  $('landscape').innerHTML = landscape(mode, palette, c.isDay && c.code <= 2);
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
