// All data in this prototype is illustrative. No network or location requests.
const $ = (id) => document.getElementById(id);
const scenarios = {
  cloudy: {label:'Mostly cloudy',temp:54,high:56,low:44,feels:52,rain:35,wind:8,gust:16,uv:1,uvLabel:'LOW',caption:'A little cloud cover. A slower afternoon.',note:'A chance of rain this evening',sky:'#3b5350',horizon:'#5c7461',description:'a cloudy afternoon',hours:[54,54,53,51,50,49,48,47,47,46,45,44]},
  rain: {label:'Rain showers',temp:49,high:52,low:43,feels:45,rain:85,wind:14,gust:28,uv:1,uvLabel:'LOW',caption:'Rain on the lake. Wind in the evergreens.',note:'Showers through the afternoon',sky:'#283c43',horizon:'#47615e',description:'a rainy afternoon',hours:[49,49,48,48,47,46,46,45,44,44,43,43]},
  clear: {label:'Clear skies',temp:58,high:60,low:45,feels:58,rain:5,wind:4,gust:9,uv:2,uvLabel:'LOW',caption:'A clear sky, all the way to the mountains.',note:'Mostly dry through tonight',sky:'#526b61',horizon:'#9d9f70',description:'a sunny afternoon',hours:[58,59,58,56,53,51,49,48,47,46,45,45]},
  night: {label:'Clear night',temp:45,high:56,low:44,feels:43,rain:10,wind:3,gust:7,uv:1,uvLabel:'LOW',caption:'The lake is quiet. The stars are out.',note:'A mostly dry night ahead',sky:'#1b2936',horizon:'#37495a',description:'a starry night',hours:[45,45,44,44,44,44,45,46,48,50,52,53]}
};

function icon(type) {
  const paths = {
    sun:'<g fill="#d4b77b"><path d="M10 0h4v4h-4zM10 20h4v4h-4zM0 10h4v4H0zM20 10h4v4h-4zM3 3h3v3H3zM18 3h3v3h-3zM3 18h3v3H3zM18 18h3v3h-3zM8 6h8v2h2v8h-2v2H8v-2H6V8h2z"/></g>',
    cloud:'<path fill="#a7bcad" d="M5 8h4V5h8v3h3v3h3v8H1v-8h4z"/><path fill="#789a92" d="M1 16h22v3H1z"/>',
    rain:'<path fill="#a7bcad" d="M5 4h4V1h8v3h3v3h3v7H1V7h4z"/><path fill="#8ab6bf" d="M5 16h2v4H5zm7 2h2v5h-2zm7-2h2v4h-2z"/>',
    moon:'<path fill="#c5d7bc" d="M9 2h6v3h-4v8h4v3h6v3h-4v3H8v-3H5v-3H2V8h3V5h4z"/><path fill="#d4b77b" d="M19 3h3v3h-3z"/>',
    wind:'<path fill="#9dc9ac" d="M2 6h14V3h5v3h-2v3H2zm0 6h20v3H2zm4 6h12v3H6z"/>',
    air:'<path fill="#9dc9ac" d="M1 4h18v3H1zm4 6h18v3H5zM1 16h18v3H1z"/>'
  };
  return `<svg class="weather-icon" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges">${paths[type] || paths.cloud}</svg>`;
}

function landscape(mode, s) {
  const rect = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const tree = (x,y,size=1) => `<g transform="translate(${x} ${y}) scale(${size})" fill="#172e2b"><path d="M8 0h4v5h4v6h4v6h4v6H0v-6h4v-6h4z"/><path d="M10 20h4v13h-4z"/></g>`;
  const cloud = (x,y,w,color) => `<path fill="${color}" d="M${x} ${y+6}h12v-6h${w-32}v6h14v6h10v10h-${w+4}V${y+12}h8z"/>`;
  let sky = '';
  if(mode==='night') {
    for(const [x,y] of [[16,15],[41,33],[73,11],[102,29],[144,15],[178,35],[218,18],[284,12],[302,41],[237,44]])sky+=rect(x,y,2,2,'#a4bdaf');
    sky+='<path fill="#d6dfb9" d="M255 16h14v5h-9v17h9v5h-15v-5h-5V21h6z"/>';
  } else {
    if(mode==='clear'||mode==='cloudy')sky+=rect(237,22,24,24,mode==='clear'?'#dbc58b':'#abb38b')+rect(242,17,14,34,mode==='clear'?'#dbc58b':'#abb38b');
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

function render(mode) {
  if (!Object.hasOwn(scenarios,mode)) return;
  const s=scenarios[mode];
  document.querySelector('main').dataset.weather=mode;
  const values={'current-title':s.label,'current-temp':s.temp,high:`${s.high}°`,low:`${s.low}°`,feels:`${s.feels}°`,'scene-caption':s.caption,'rain-value':s.rain,'rain-note':s.note,'wind-value':s.wind,'gust-value':`${s.gust} mph`,'uv-value':s.uv,'uv-label':s.uvLabel,'wind-status':s.gust>=25?'≋ Gusty at times':'≋ A light breeze',clock:mode==='night'?'9:24 PM':'2:24 PM'};
  for (const [id,value] of Object.entries(values)) $(id).textContent=value;
  $('rain-meter').style.width=`${s.rain}%`;
  $('landscape').innerHTML=landscape(mode,s);
  $('landscape').setAttribute('aria-label',`Pixel art of ${s.description} over Lake Washington`);
  const start=mode==='night'?21:14;
  $('hourly').innerHTML=s.hours.map((temp,i)=>{
    const h=(start+i)%24;
    const time=i===0?'NOW':`${h%12||12}${h>=12?'PM':'AM'}`;
    const type=mode==='rain'?'rain':h>=17||h<7?'moon':mode==='clear'?'sun':'cloud';
    const chance=mode==='rain'?Math.max(40,85-i*3):mode==='clear'?5:mode==='night'?10:Math.min(35,10+i*3);
    return `<div class="hour"><span class="time">${time}</span>${icon(type)}<span class="hour-temp">${temp}°</span><span class="rain-chance" aria-label="${chance}% chance of rain">${chance}%</span></div>`;
  }).join('');
  const days=[['Today',s.low,s.high,mode==='rain'?'rain':mode==='clear'?'sun':'cloud',s.rain],['Wed',43,52,'rain',80],['Thu',42,53,'rain',65],['Fri',40,55,'cloud',20],['Sat',41,57,'sun',5]];
  const min=Math.min(...days.map(d=>d[1]))-2,max=Math.max(...days.map(d=>d[2]))+2;
  $('daily').innerHTML=days.map(([name,low,high,type,chance])=>`<div class="day"><div class="day-name">${name}<span class="day-rain" aria-label="${chance}% chance of rain">${chance}%</span></div>${icon(type)}<span class="day-low" aria-label="Low ${low} degrees">${low}°</span><div class="range-track" aria-hidden="true"><span class="range-bar" style="left:${(low-min)/(max-min)*100}%;width:${(high-low)/(max-min)*100}%"></span></div><span class="day-high" aria-label="High ${high} degrees">${high}°</span></div>`).join('');
  document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===mode)));
}

document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
  render(button.dataset.scene);
  $('scene-status').textContent=`${scenarios[button.dataset.scene].label} sample selected. Scroll to the top to see the sky.`;
}));
render('cloudy');
