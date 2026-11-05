import {mkdir,writeFile} from 'node:fs/promises';
import {WEATHER_CONDITIONS,backgroundAssets} from '../weather-scenes.mjs';
const root=new URL('../',import.meta.url);
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

// Static vector washes over two shared raster canvases. No filters, animation,
// scripts or remote resources: every layer is deterministic and cached offline.
function cloud(x,y,scale,day,dark=false){
  const ink=day?'#617b7c':'#9baeb7',wash=day?(dark?'#6e858b':'#edf0dd'):(dark?'#2e424f':'#78909c');
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M2 27C-7 17 1 7 14 10C17-5 39-4 44 9C56 4 66 16 61 26C52 32 15 31 2 27Z" fill="${wash}" opacity=".7"/><path d="M1 25C13 22 25 29 38 25C47 23 56 27 61 24" fill="none" stroke="${ink}" stroke-width=".7" opacity=".4"/><path d="M9 23C9 12 18 11 23 14M28 8C36 5 41 11 41 15" fill="none" stroke="${ink}" stroke-width=".55" opacity=".35"/></g>`;
}
function sky(item,day){
  const parts=[],open=['clear','mostly-clear','partly-cloudy'].includes(item.kind);
  const wet=['rain','rain-showers','drizzle','freezing-rain','freezing-drizzle','thunderstorm','hail'].includes(item.kind);
  if(item.kind==='overcast'||wet){
    // A continuous stratus ceiling with broad, soft washes, not cloud silhouettes.
    const ceiling=day?(wet?'#87999f':'#9ca9ad'):(wet?'#283e4b':'#304653'),shade=day?'#657b87':'#172c3b';
    return `<defs><linearGradient id="blanket" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="440"><stop stop-color="${ceiling}" stop-opacity=".98"/><stop offset=".62" stop-color="${ceiling}" stop-opacity=".96"/><stop offset=".82" stop-color="${ceiling}" stop-opacity=".85"/><stop offset="1" stop-color="${ceiling}" stop-opacity="0"/></linearGradient><linearGradient id="stratus" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${shade}" stop-opacity="0"/><stop offset=".5" stop-color="${shade}" stop-opacity=".12"/><stop offset="1" stop-color="${shade}" stop-opacity="0"/></linearGradient></defs><g data-layer="cloud-cover"><path d="M0 0H320V440H0Z" fill="url(#blanket)"/></g><g data-layer="clouds" data-coverage="${wet?'rain':'overcast'}"><path d="M-20 28Q85 8 180 36T340 22V118Q230 136 130 112T-20 124Z" fill="url(#stratus)"/><path d="M-20 138Q90 158 180 139T340 152V253Q240 234 140 254T-20 240Z" fill="url(#stratus)"/><path d="M-20 273Q100 250 210 275T340 263V359Q235 380 135 357T-20 370Z" fill="url(#stratus)"/></g>`;
  }
  if(open){
    if(day)parts.push('<g data-layer="sun"><circle cx="260" cy="95" r="25" fill="#eed38c" opacity=".2"/><circle cx="260" cy="95" r="18" fill="#e9c76b" opacity=".65"/><path d="M244 98C241 75 279 72 277 96C277 119 243 116 244 98Z" fill="none" stroke="#9e8a55" stroke-width=".6" opacity=".5"/></g>');
    else parts.push('<g data-layer="stars" fill="#f2df9b" opacity=".75"><circle cx="29" cy="65" r="1"/><circle cx="90" cy="30" r=".9"/><circle cx="183" cy="90" r="1"/><circle cx="298" cy="36" r=".9"/><circle cx="63" cy="213" r=".8"/></g><path data-layer="moon" d="M269 75C245 75 240 112 265 117C275 120 285 113 288 105C261 112 252 90 269 75Z" fill="#e9cc83" stroke="#b7af83" stroke-width=".5" opacity=".9"/>');
  }
  if(item.kind!=='clear'&&item.kind!=='unknown'){
    const count=item.kind==='mostly-clear'?1:item.kind==='partly-cloudy'?2:4;
    const dark=['thunderstorm','hail'].includes(item.kind);
    const positions=[[204,106,1.5],[-12,151,1.8],[82,30,2.1],[180,223,2.5]];
    parts.push(`<g data-layer="clouds">${positions.slice(0,count).map(([x,y,s])=>cloud(x,y,s,day,dark)).join('')}</g>`);
    if(!open)parts.unshift(`<path data-layer="cloud-cover" d="M0 0H320V395C215 355 92 408 0 372Z" fill="url(#cover)"/>`);
  }
  return parts.join('');
}
function precipitation(item,day){
  const snow=item.kind.startsWith('snow'),ice=item.kind.startsWith('freezing')&&!item.kind.includes('fog'),storm=['thunderstorm','hail'].includes(item.kind),rain=ice||storm||['rain','rain-showers','drizzle'].includes(item.kind);
  if(!snow&&!rain)return '';
  const drizzle=item.kind.includes('drizzle');
  const count=(snow?20:drizzle?45:60)*(item.intensity||1),ink=day?'#526f83':'#adc6d1';
  let marks='';
  for(let i=0;i<count;i++){
    const x=(i*71+19)%320,y=(snow?130:45)+(i*47+item.code*3)%(snow?535:620);
    if(item.kind.includes('showers')&&x>130&&x<155)continue;
    if(snow){
      marks+=item.kind==='snow-grains'?`<circle cx="${x}" cy="${y}" r="1.2" fill="#faf9eb" opacity=".8"/>`:`<path d="M${x-2} ${y}h4m-2-2v4m-1.5-3.5 3 3m0-3-3 3" stroke="#f9f8eb" stroke-width=".9" stroke-linecap="round" opacity=".9"/>`;
    }else{
      const length=drizzle?3:6+item.intensity*3;
      marks+=`<path d="m${x} ${y} -1.8 ${length}" opacity="${i%3===0?.4:.7}"/>`;
      if(ice&&i%3===0)marks+=`<path d="m${x+3} ${y+7} 1.5 2-1.5 2-1.5-2Z" fill="#e1edf0" stroke="${ink}" stroke-width=".4"/>`;
    }
  }
  let extra='';
  if(storm){
    extra='<path data-layer="lightning" d="m266 191-15 29h11l-14 28 32-36h-14l11-21Z" fill="#e7d59d" stroke="#c8c4a1" stroke-width=".5" opacity=".65"/>';
    if(item.intensity===3)extra+='<path d="m41 308-9 17h7l-9 18 20-22h-9l7-13Z" fill="#d6d8b8" opacity=".5"/>';
    if(item.kind==='hail')extra+=`<g data-layer="hail">${Array.from({length:12*item.intensity},(_,i)=>`<path d="m${(i*43+25)%310} ${340+(i*19)%310} 2 2-2 3-2-3Z" fill="#f0f3e6" stroke="${ink}" stroke-width=".45" opacity=".85"/>`).join('')}</g>`;
  }
  return `<g data-layer="${snow?'snow':ice?'ice':'rain'}" data-intensity="${item.intensity}"${rain?` fill="none" stroke="${ink}" stroke-width="${drizzle?.6:.8}" stroke-linecap="round"`: ''}>${marks}</g>${extra}`;
}
function fog(item,day){
  if(!item.kind.includes('fog'))return '';
  let marks='';
  for(let i=0;i<7;i++)marks+=`<path d="M-20 ${350+i*38}Q80 ${325+i*38} 170 ${353+i*38}T345 ${344+i*38}v24Q220 ${392+i*38} 130 ${374+i*38}T-20 ${382+i*38}Z" fill="${day?'#f1f0e1':'#a4b9bf'}" opacity="${.12+i*.025}"/>`;
  return `<g data-layer="fog">${marks}</g>`;
}
function frost(item){
  if(!item.kind.startsWith('freezing'))return '';
  return '<g data-layer="frost" stroke="#d5e8e8" stroke-width=".6" opacity=".65"><path d="m5 586 15 16m-12-8 0-8m7 15 8-1M300 594l15-17m-11 12-1-8m5 3 8 1"/></g>';
}
export function weatherLayer(item,day){
  const cover=day?'#7b8f96':'#192d3b';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 680" preserveAspectRatio="xMidYMid slice" data-weather-code="${item.code??'unknown'}" data-period="${day?'day':'night'}"><title>${escape(item.label)} · ${day?'day':'night'} weather layer</title><defs><linearGradient id="cover" x2="0" y2="1"><stop stop-color="${cover}" stop-opacity=".7"/><stop offset="1" stop-color="${cover}" stop-opacity="0"/></linearGradient></defs>${sky(item,day)}${precipitation(item,day)}${fog(item,day)}${frost(item)}</svg>\n`;
}
export async function generateBackgrounds(){
  await mkdir(new URL('assets/weather/',root),{recursive:true});
  const all=[...WEATHER_CONDITIONS,{code:null,label:'Conditions unavailable',kind:'unknown',intensity:0}];
  for(const item of all)for(const day of [true,false])await writeFile(new URL(backgroundAssets(item.code,day).atmosphere,root),weatherLayer(item,day));
  return all.length*2;
}
if(process.argv[1]&&new URL(process.argv[1],'file://').href===import.meta.url)console.log(`Generated ${await generateBackgrounds()} static weather layers.`);
