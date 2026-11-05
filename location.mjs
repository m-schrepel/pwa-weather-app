import { LOCATION, validateLocation } from './weather.mjs';

export function coordinateLabel({latitude, longitude}) {
  validateLocation({latitude, longitude});
  return `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? 'S' : 'N'}, ${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? 'W' : 'E'}`;
}

// Request only a one-time fix; no continuous GPS tracking or location storage.
export function detectLocation(geolocation = globalThis.navigator?.geolocation) {
  if (!geolocation) return Promise.resolve({error:'Location unavailable in this browser.'});
  return new Promise(resolve => {
    let finished = false;
    const finish = result => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(result);
    };
    // Browser timeout excludes time spent waiting for permission. Keep the
    // dashboard usable even if the permission prompt is left unanswered.
    const timer = setTimeout(() => finish({error:'Location request timed out.'}), 12000);
    try {
      geolocation.getCurrentPosition(position => {
        try {
          validateLocation(position.coords);
          const latitude = Number(position.coords.latitude.toFixed(3));
          const longitude = Number(position.coords.longitude.toFixed(3));
          finish({location:{latitude, longitude, timezone:'auto'}});
        } catch { finish({error:'Location unavailable. Please try again.'}); }
      }, error => finish({error:error?.code === 1 ? 'Location access blocked. Allow location in your browser settings to use it.' : error?.code === 3 ? 'Location request timed out.' : 'Could not determine your location.'}),
      {enableHighAccuracy:false, maximumAge:5 * 60_000, timeout:10000});
    } catch { finish({error:'Location unavailable in this browser.'}); }
  });
}

export const FALLBACK_LOCATION = Object.freeze({...LOCATION, name:'Kirkland, WA'});
