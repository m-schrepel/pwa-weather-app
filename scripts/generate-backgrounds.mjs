import {mkdir,writeFile} from 'node:fs/promises';
import {WEATHER_CONDITIONS,backgroundAssets} from '../weather-scenes.mjs';
const root = new URL('../',import.meta.url);
const rect = (x,y,w,h,color,opacity=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`;
const cloud = (x,y,w,color)=>`<path d="M${x} ${y+8}h14v-8h${w-40}v8h16v8h14v16H${x-8}V${y+16}h8z" fill="${color}"/>`;
const tree = (x,y,scale,color)=>`<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}"><path d="M8 0h4v5h4v6h4v6h4v6H0v-6h4v-6h4z"/><path d="M10 20h4v13h-4z"/></g>`;
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function palette(item,day) {
  const snow = item.kind.startsWith('snow'), ice = item.kind.startsWith('freezing'), storm = ['thunderstorm','hail'].includes(item.kind), wet = ['rain','rain-showers','drizzle'].includes(item.kind), fog = item.kind.includes('fog');
  if(!day)return {sky:storm?'#14222f':'#1b2936',horizon:'#3c5260',cloud:storm?'#3f5664':'#526674',cloudDark:'#334b59',mountain:'#45616a',snow:'#a8c0c0',water:'#2c4a52',glint:'#638b92',bank:snow||ice?'#709793':'#24483e',tree:'#142d30',frost:'#b2cdcd',fog:'#9eb1b3'};
  return {sky:storm?'#2a3e49':fog?'#5f746e':snow||ice?'#46616a':wet?'#344f54':item.kind==='clear'?'#526e65':'#3b5350',horizon:storm?'#4d6571':snow||ice?'#a6bab8':'#8c9e82',cloud:storm?'#647c86':snow||ice?'#9db3b8':wet?'#78948f':'#9aab94',cloudDark:storm?'#455f6d':wet?'#526f72':'#657f73',mountain:snow||ice?'#87a3a8':'#809586',snow:'#d1ddd0',water:snow||ice?'#517a7f':storm?'#345a65':'#456b61',glint:storm?'#648d97':'#a2b49a',bank:snow||ice?'#afc7bd':'#294c40',tree:ice?'#36585b':'#1b352d',frost:'#d1e1d4',fog:'#bac9be'};
}
function sky(item,day,p,wide) {
  const y = wide ? 12 : 190;
  const parts = [];
  const open = ['clear','mostly-clear','partly-cloudy'].includes(item.kind);
  if(open) {
    if(day) {
      parts.push(`<g data-layer="sun" fill="#d1b77d">${rect(244,y+8,28,28,'#d1b77d')}${rect(251,y+1,14,42,'#d1b77d')}</g>`);
    } else {
      parts.push(`<g data-layer="stars">${[[20,10],[80,38],[144,11],[190,53],[298,16],[215,83],[111,102]].map(([x,z])=>rect(x,y+z,2,2,'#a9c4ba')).join('')}</g><path data-layer="moon" fill="#c6d4b4" d="M252 ${y+5}h22v7h-15v26h15v7h-22v-7h-7v-26h7z"/>`);
    }
  }
  if(item.kind!=='clear') {
    const count=item.kind==='mostly-clear'?1:item.kind==='partly-cloudy'?2:3;
    const positions=wide?[[169,38,137],[42,91,143],[-55,30,115]]:[[22,35,100],[179,69,126],[-35,113,111]];
    parts.push(`<g data-layer="clouds">${positions.slice(0,count).map(([x,z,w],i)=>cloud(x,y+z,w,i===0?p.cloud:p.cloudDark)).join('')}</g>`);
  }
  return parts.join('');
}
function precipitation(item,p,wide) {
  const snow=item.kind.startsWith('snow'), ice=item.kind.startsWith('freezing')&&!item.kind.includes('fog'), storm=['thunderstorm','hail'].includes(item.kind), wet=ice||storm||['rain','rain-showers','drizzle'].includes(item.kind);
  if(!snow&&!wet)return '';
  const count=(wide?10:38)*(item.intensity||1), start=wide?70:130, range=wide?95:535;
  let marks='';
  for(let i=0;i<count;i++) {
    const x=(i*71+19)%320,y=start+(i*47+item.code*3)%range;
    if(item.kind.includes('showers')&&x>105&&x<175)continue;
    if(snow) {
      const grains=item.kind==='snow-grains';
      marks+=grains?rect(x,y,2,2,p.snow):`<path d="M${x} ${y-2}h2v2h2v2h-2v2h-2v-2h-2v-2h2z" fill="${p.snow}" opacity=".8"/>`;
    } else {
      const drizzle=item.kind.includes('drizzle');
      marks+=rect(x,y,ice?2:1,drizzle?2:4+item.intensity*2,ice?p.frost:'#9bbcc2',.65);
      if(ice&&i%4===0)marks+=rect(x+3,y+8,2,2,p.frost);
    }
  }
  if(storm) {
    const y=wide?67:315;
    marks+=`<path data-layer="lightning" d="M232 ${y}h24l-20 29h18l-42 45 12-34h-17z" fill="#d1bf82" opacity=".9"/>`;
    if(item.intensity===3)marks+=`<path d="M68 ${y+15}h12l-10 18h10l-23 26 7-22H55z" fill="#b7c8b4"/>`;
    if(item.kind==='hail')for(let i=0;i<(wide?9:28)*item.intensity;i++)marks+=rect((i*43+25)%310,wide?114+(i*11)%52:380+(i*19)%270,3,3,p.frost,.9);
  }
  return `<g data-layer="${snow?'snow':ice?'ice':'rain'}">${marks}</g>`;
}
function fog(item,p,wide) {
  if(!item.kind.includes('fog'))return '';
  const count=wide?4:7;
  return `<g data-layer="fog">${Array.from({length:count},(_,i)=>rect((i%2)*-25,(wide?40:230)+i*(wide?29:58),350,wide?14:22,p.fog,.12+i*.025)).join('')}</g>`;
}
function terrain(item,p,day) {
  const snowy=item.kind.startsWith('snow'),frosty=item.kind.startsWith('freezing');
  let art=`<g data-layer="terrain" transform="translate(0 470) scale(1 1.36)">${rect(0,76,320,79,p.horizon)}<g opacity="${item.kind.includes('fog')?'.4':'1'}"><path d="M0 98V84h18v-6h19V68h22v8h16v9h24v-7h16V65h17v-8h17v11h17v8h20v10h19V75h19V61h17V48h12v8h12v12h16v11h22v9h17v10z" fill="${p.mountain}"/><path d="M237 61h8V48h12v8h12v12h-12v-7h-8v6h-12z" fill="${p.snow}"/></g>${rect(0,99,320,56,p.water)}`;
  for(let i=0;i<22;i++)art+=rect((i*47+13)%310,105+(i*11)%43,7+(i*13)%26,1,p.glint,day?.7:.4);
  art+=`<path fill="${p.bank}" d="M0 92h27v7h23v7h37v6h29v8H0zM320 89h-22v8h-20v6h-24v7h-22v8h88z"/>${tree(-8,65,1.6,p.tree)}${tree(12,80,1.1,p.tree)}${tree(285,70,1.6,p.tree)}${tree(269,85,1,p.tree)}<path fill="${snowy?p.bank:p.tree}" d="M0 137h24v-5h24v6h22v5h31v12H0zM320 131h-18v7h-21v5h-24v12h63z"/>`;
  if(snowy||frosty)art+=`<g data-layer="frost" fill="${p.frost}"><path d="M3 79h8v3h-8zM6 87h12v3H6zM291 81h10v3h-10zM286 92h18v3h-18zM0 132h22v3H0zM294 134h26v3h-26z"/></g>`;
  return art+'</g>';
}
function svg(item,day,wide=false) {
  const p=palette(item,day),h=wide?170:680;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${h}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" data-weather-code="${item.code??'unknown'}" data-period="${day?'day':'night'}"><title>${escape(item.label)} · ${day?'day':'night'}</title>${wide?'':rect(0,0,320,h,p.sky)}${sky(item,day,p,wide)}${wide?'':terrain(item,p,day)}${precipitation(item,p,wide)}${fog(item,p,wide)}</svg>\n`;
}
export async function generateBackgrounds() {
  await mkdir(new URL('assets/weather/',root),{recursive:true});
  const all=[...WEATHER_CONDITIONS,{code:null,label:'Conditions unavailable',kind:'unknown',intensity:0}];
  for(const item of all)for(const day of [true,false]) {
    const files=backgroundAssets(item.code,day);
    await writeFile(new URL(files.landscape,root),svg(item,day));
    await writeFile(new URL(files.temperature,root),svg(item,day,true));
  }
  return all.length*4;
}
if(process.argv[1] && new URL(process.argv[1],'file://').href===import.meta.url)console.log(`Generated ${await generateBackgrounds()} static weather assets.`);
