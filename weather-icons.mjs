// Original watercolor-wash weather symbols, drawn as scalable SVG.
const inkCloud='<path fill="var(--icon-paper, #fffaf0)" d="M6 21C1 20 2 13 7 13C7 6 18 5 21 12C28 10 32 21 25 22L6 21Z"/>';
const inkSun='<circle cx="16" cy="15" r="6"/><path d="m16 3 .3 3M16 24v4M4 15h3m18 0h4M7 6l3 3m12 13 3 3M6 25l3-3M23 8l3-3"/>';
const inkMoon='<path d="M22 4C8 3 3 22 18 27c5 1 9-2 10-6C14 24 11 10 22 4Z"/>';
const inkDrops='<path d="m8 25-2 4m10-4-2 4m10-4-2 4"/>';
const inkFlakes='<path d="M8 25v5m-2-4 4 3m0-3-4 3m15-4v5m-2-4 4 3m0-3-4 3"/>';
const inkBolt='<path d="m17 19-6 7h5l-2 5 10-9h-6l3-3"/>';
const GLYPHS=Object.freeze({
  sun:inkSun,
  moon:inkMoon,
  cloud:inkCloud,
  'partly-cloudy':`<g transform="translate(0 -2) scale(.76)">${inkSun}</g>${inkCloud}`,
  'partly-cloudy-night':`<g transform="translate(-1 -3) scale(.8)">${inkMoon}</g>${inkCloud}`,
  rain:inkCloud+inkDrops,
  'freezing-rain':inkCloud+'<path d="m7 25-2 4m9-4-2 4m11-4v5m-3-4 6 3m0-3-6 3"/>',
  snow:inkCloud+inkFlakes,
  fog:'<path d="M5 12c1-5 7-5 9-2 4-6 12-2 12 3M3 17c7-2 15 2 26 0M5 22c5 1 16-2 23 0M3 27c10-2 19 2 25 0"/>',
  storm:inkCloud+inkBolt,
  hail:inkCloud+'<path d="m7 25 2 2-2 3-2-3Zm15 0 2 2-2 3-2-3Z"/><path d="m16 24-2 5"/>',
  wind:'<path d="M3 10c7-1 9 1 15 0 9-1 8-9 3-7-2 1-2 3-1 4M4 16c8-1 15 1 24 0M3 22c6-1 10 0 15 0 8 0 8 8 3 7-2 0-3-2-2-3"/>',
  air:'<path d="M3 9c8-3 16 3 26-1M4 16c7-3 15 3 24-1M3 23c8-3 16 3 26-1"/>',
  unknown:inkCloud+'<path d="M14 13c0-3 5-3 5 0 0 2-3 2-3 4m0 2v.2"/>',
});

/* Original pencil contours with translucent color washes. No raster texture at small sizes. */
const storyWash={
 sun:'<path fill="#e6b64d" opacity=".5" d="M9 14c0-9 15-9 15 1 0 10-16 8-15-1Z"/><path fill="#efd47f" opacity=".5" d="M10 12c2-5 10-5 12 1 1 7-11 10-12-1Z"/>',
 moon:'<path fill="#d3b75e" opacity=".5" d="M22 4C8 3 3 22 18 27c5 1 9-2 10-6C14 24 11 10 22 4Z"/>',
 cloud:'<path fill="#a8c5c2" opacity=".38" d="M5 22C0 19 4 12 8 13 9 5 19 6 22 13 29 10 31 23 24 23Z"/><path fill="#8eafaf" opacity=".2" d="M5 19c8-3 12 3 23-1l-3 5H6Z"/>',
};
export function icon(type){
 const key=Object.hasOwn(GLYPHS,type)?type:'unknown';
 let wash=key==='sun'?storyWash.sun:key==='moon'?storyWash.moon:'';
 if(key==='partly-cloudy')wash+=`<g transform="translate(0 -2) scale(.76)">${storyWash.sun}</g>`;
 if(key==='partly-cloudy-night')wash+=`<g transform="translate(-1 -3) scale(.8)">${storyWash.moon}</g>`;

 if(['rain','freezing-rain','hail','snow'].includes(key))wash+='<path fill="#75a8b6" opacity=".4" d="m7 24 2 5-4 1Zm15 0 2 5-4 1Z"/>';
 if(key==='storm')wash+='<path fill="#e2b756" opacity=".6" d="m17 19-6 7h5l-2 5 10-9h-6l3-3"/>';
 if(key==='fog'||key==='air'||key==='wind')wash+='<path d="M4 13q11-3 23 0M4 21q11 3 23 0" stroke="#9aada0" stroke-width="4" opacity=".28"/>';
 const paperCloud=inkCloud.replace('fill="var(--icon-paper, #fffaf0)"','fill="var(--icon-paper, #faf6e9)" stroke="none"');
 const outlineCloud=inkCloud.replace('fill="var(--icon-paper, #fffaf0)"','fill="none"');
 const cloudLayer=paperCloud+`<g stroke="none">${storyWash.cloud}</g>`+outlineCloud;
 const lines=GLYPHS[key].replace(inkCloud,cloudLayer);
 return `<svg class="weather-icon story-icon" data-glyph="${key}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="none">${wash}</g>${lines}</svg>`;
}

export const ICON_TYPES=Object.freeze(Object.keys(GLYPHS));
