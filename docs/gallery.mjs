import {WEATHER_CONDITIONS,backgroundAssets} from './weather-scenes.mjs';
const family=document.getElementById('family'),period=document.getElementById('period');
function group(item) {
  if(item.code===null)return 'unknown';
  if(item.kind.startsWith('freezing')&&!item.kind.includes('fog'))return 'ice';
  if(item.kind.includes('fog'))return 'fog';
  if(item.kind.startsWith('snow'))return 'snow';
  if(['thunderstorm','hail'].includes(item.kind))return 'storm';
  if(['rain','rain-showers','drizzle'].includes(item.kind))return 'rain';
  return 'sky';
}
function render() {
  const conditions=[...WEATHER_CONDITIONS,{code:null,label:'Conditions unavailable',kind:'unknown'}].filter(item=>family.value==='all'||group(item)===family.value);
  const periods=period.value==='both'?[true,false]:[period.value==='day'];
  document.getElementById('gallery').innerHTML=conditions.map(item=>`<article class="card"><div class="card-header"><p class="code">${item.code===null?'FALLBACK':`WMO ${item.code}`}</p><h2>${item.label}</h2></div><div class="variants">${periods.map(day=>{
    const assets=backgroundAssets(item.code,day),name=day?'Day':'Night';
    return `<section class="variant"><h3>${name.toUpperCase()}</h3><img class="scene" src="${assets.landscape}" alt="${item.label}, ${name.toLowerCase()}, lake scene" loading="lazy"><img class="strip" src="${assets.temperature}" alt="${item.label}, ${name.toLowerCase()}, temperature backdrop" loading="lazy"><div class="asset-links"><a href="${assets.landscape}">Scene SVG</a><a href="${assets.temperature}">Strip SVG</a></div></section>`;
  }).join('')}</div></article>`).join('');
  document.getElementById('count').textContent=`${conditions.length} conditions · ${conditions.length*periods.length*2} assets shown`;
}
family.addEventListener('change',render);period.addEventListener('change',render);render();
