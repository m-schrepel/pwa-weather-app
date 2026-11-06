// Solar geometry using NOAA's Meeus-based equations. All instants are UTC ms;
// latitude is north-positive, longitude east-positive, azimuth clockwise from north.
// https://gml.noaa.gov/grad/solcalc/calcdetails.html
const rad = Math.PI / 180;
const deg = 180 / Math.PI;
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const wrap = x => (x % 360 + 360) % 360;

export function solarPosition(instant, {latitude, longitude}) {
  if (!Number.isFinite(instant) || !Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new RangeError('Invalid solar time or location');
  const t = (instant / 86400000 + 2440587.5 - 2451545) / 36525;
  const meanLongitude = wrap(280.46646 + t * (36000.76983 + .0003032 * t));
  const anomaly = (357.52911 + t * (35999.05029 - .0001537 * t)) * rad;
  const eccentricity = .016708634 - t * (.000042037 + .0000001267 * t);
  const center = Math.sin(anomaly) * (1.914602 - t * (.004817 + .000014 * t)) + Math.sin(2 * anomaly) * (.019993 - .000101 * t) + Math.sin(3 * anomaly) * .000289;
  const omega = (125.04 - 1934.136 * t) * rad;
  const apparentLongitude = (meanLongitude + center - .00569 - .00478 * Math.sin(omega)) * rad;
  const obliquity = (23 + (26 + (21.448 - t * (46.815 + t * (.00059 - .001813 * t))) / 60) / 60 + .00256 * Math.cos(omega)) * rad;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude));
  const y = Math.tan(obliquity / 2) ** 2, l = meanLongitude * rad;
  const equationOfTime = 4 * deg * (y * Math.sin(2*l) - 2 * eccentricity * Math.sin(anomaly) + 4 * eccentricity * y * Math.sin(anomaly) * Math.cos(2*l) - .5 * y*y * Math.sin(4*l) - 1.25 * eccentricity**2 * Math.sin(2*anomaly));
  const utcMinutes = ((instant % 86400000 + 86400000) % 86400000) / 60000;
  const hourAngle = (wrap((utcMinutes + equationOfTime + 4 * longitude) / 4) - 180) * rad;
  const lat = latitude * rad;
  const elevation = Math.asin(clamp(Math.sin(lat)*Math.sin(declination) + Math.cos(lat)*Math.cos(declination)*Math.cos(hourAngle), -1, 1)) * deg;
  const azimuth = wrap(Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle)*Math.sin(lat) - Math.tan(declination)*Math.cos(lat)) * deg + 180);
  const tangent = Math.tan(elevation * rad);
  let refraction = 0;
  if (elevation <= 85 && elevation > 5) refraction = (58.1/tangent - .07/tangent**3 + .000086/tangent**5) / 3600;
  else if (elevation <= 5 && elevation > -.575) refraction = (1735 + elevation * (-518.2 + elevation * (103.4 + elevation * (-12.79 + elevation * .711)))) / 3600;
  else if (elevation <= -.575) refraction = -.005611 / tangent;
  return {elevation, apparentElevation:elevation + refraction, azimuth, declination:declination*deg, equationOfTime};
}

// Resolve a civil midnight with the actual timezone offset, including DST.
function midnight(date, timezone) {
  const target = Date.parse(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(target) || new Date(target).toISOString().slice(0,10) !== date) throw new RangeError('Invalid solar date');
  const formatter = new Intl.DateTimeFormat('en-US', {timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
  let guess = target;
  for (let i=0; i<4; i++) {
    const p = Object.fromEntries(formatter.formatToParts(guess).map(part => [part.type, part.value]));
    guess += target - Date.UTC(+p.year, +p.month-1, +p.day, +p.hour, +p.minute, +p.second);
  }
  return guess;
}

export function solarDay(date, location, timezone) {
  const start = midnight(date, timezone);
  const tomorrow = new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0,10);
  const end = midnight(tomorrow, timezone);
  const height = time => solarPosition(time, location).elevation;
  // Conventional sunrise: solar center at -0.833°, accounting for disk/refraction.
  let sunrise = null, sunset = null;
  for (let a=start; a<end; a+=300000) {
    const b = Math.min(a+300000, end), ha = height(a)+.833, hb = height(b)+.833;
    if ((ha<0 && hb>=0) || (ha>=0 && hb<0)) {
      let low=a, high=b;
      for (let i=0; i<30; i++) {
        const mid=(low+high)/2;
        if ((height(mid)+.833>=0) === (ha>=0)) low=mid; else high=mid;
      }
      if (ha<0) sunrise=(low+high)/2; else sunset=(low+high)/2;
    }
  }
  let low=start, high=end;
  for (let i=0; i<65; i++) {
    const a=low+(high-low)/3, b=high-(high-low)/3;
    if (height(a)<height(b)) low=a; else high=b;
  }
  const noon=(low+high)/2;
  return {sunrise, sunset, noon, maxElevation:height(noon), start, end};
}

const smooth = (low, high, x) => { const t=clamp((x-low)/(high-low),0,1); return t*t*(3-2*t); };

// Art direction, not measured illuminance. Geometry determines the input;
// perceptual curves control exposure, day/night blending and low-sun warmth.
export function clearSkyLight(elevation) {
  if (!Number.isFinite(elevation)) throw new RangeError('Invalid solar elevation');
  const daylight = smooth(-6, 18, elevation);
  const sunHeight = Math.max(0, Math.sin(elevation * rad));
  return {
    dayBlend:.15 + .85 * daylight,
    exposure:.56 + .44 * sunHeight**.35,
    warmth:(1-smooth(0,16,elevation)) * smooth(-8,0,elevation) * .26,
    twilight:1-smooth(-6,6,elevation),
  };
}
