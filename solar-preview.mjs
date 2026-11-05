import {solarPosition, solarDay, clearSkyLight} from './solar.mjs';
const location={latitude:47.716,longitude:-122.211}, timezone='America/Los_Angeles';
const $=id=>document.getElementById(id), painting=$('painting'), slider=$('day-slider');
const clock=time=>new Intl.DateTimeFormat('en-US',{timeZone:timezone,hour:'numeric',minute:'2-digit'}).format(time);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let day;
const direction=azimuth=>['N','NE','E','SE','S','SW','W','NW'][Math.round(azimuth/45)%8];

function render(){
  if(!day?.sunrise||!day?.sunset)return;
  const fraction=Number(slider.value)/1000;
  const time=day.sunrise+fraction*(day.sunset-day.sunrise);
  const position=solarPosition(time,location), light=clearSkyLight(position.elevation);
  const relative=((position.azimuth-270+540)%360)-180;
  const inView=Math.abs(relative)<60;
  // Illustrative west-facing perspective; the artwork itself isn't camera-calibrated.
  const x=50+Math.tan(relative*Math.PI/180)/Math.tan(Math.PI/3)*50;
  for(const [key,value] of Object.entries({'--day-blend':light.dayBlend,'--exposure':light.exposure,'--warmth':light.warmth,'--glow-x':`${clamp(x,0,100)}%`,'--ink':light.dayBlend<.55?'#f5e4c2':'#203c36'}))painting.style.setProperty(key,value);
  $('clock').textContent=$('scene-clock').textContent=clock(time);
  slider.setAttribute('aria-valuetext',`${clock(time)}, sun elevation ${position.apparentElevation.toFixed(1)} degrees`);
  $('elevation').textContent=`${position.apparentElevation.toFixed(1)}°`;
  $('azimuth').textContent=`${Math.round(position.azimuth)}° ${direction(position.azimuth)}`;
  $('blend').textContent=`${Math.round(light.dayBlend*100)}%`;
  const morning=time<day.noon;
  $('phase').textContent=position.elevation<6?(morning?'First light':'Last light'):position.elevation<14?(morning?'Morning light':'Evening light'):'Clear daylight';
  $('sun-location').textContent=`Sun ${position.apparentElevation.toFixed(1)}° above the horizon · ${direction(position.azimuth)}`;
  $('view-note').textContent=inView?'Low western light warms the horizon as the sun approaches sunset.':'The sun is outside this west-facing view. Its height still controls the light across the painting.';
  $('arc-dot').setAttribute('cx',10+fraction*280);
  $('arc-dot').setAttribute('cy',86-Math.max(0,position.elevation)/Math.max(1,day.maxElevation)*66);
}
function updateDay(){
  try{
    day=solarDay($('study-date').value,location,timezone);
    const available=day.sunrise!==null&&day.sunset!==null;
    slider.disabled=!available;
    $('error').hidden=available;
    if(!available){$('error').textContent='This date has no sunrise-to-sunset interval.';return;}
    $('rise').textContent=clock(day.sunrise);$('set').textContent=clock(day.sunset);
    const path=Array.from({length:101},(_,i)=>{
      const p=solarPosition(day.sunrise+(day.sunset-day.sunrise)*i/100,location);
      return `${i?'L':'M'}${10+i*2.8},${86-Math.max(0,p.elevation)/Math.max(1,day.maxElevation)*66}`;
    }).join(' ');
    $('day-arc').setAttribute('d',path);
    render();
  }catch(error){$('error').hidden=false;$('error').textContent='Choose a valid date to explore the daylight.';slider.disabled=true;}
}
slider.addEventListener('input',render);
$('study-date').addEventListener('change',updateDay);
document.querySelectorAll('[data-moment]').forEach(button=>button.addEventListener('click',()=>{
  if(!day?.sunrise||!day?.sunset)return;
  slider.value=Math.round((day[button.dataset.moment]-day.sunrise)/(day.sunset-day.sunrise)*1000);
  render();
}));
updateDay();
