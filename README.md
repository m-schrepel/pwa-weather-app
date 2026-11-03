# Weather / LCD prototype

A phone-first, ad-free weather PWA for a Samsung Galaxy S24. This first version is a **local design prototype with illustrative Kirkland, WA data**, not a live forecast.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173.

No dependencies, build step, API keys, accounts, or external fonts. The condition buttons at the bottom compare cloudy, rainy, clear, and nighttime scenes using sample data.

## Design brief

- Phone only, primarily Galaxy S24; dark LCD/pixel style.
- Current conditions, today's high/low, and feels-like first.
- Next 12 hours and a five-day forecast on one scrolling page.
- Rain chance, gusts, UV, US AQI, sunrise, and sunset.
- Future live version: current location, Kirkland (98034) fallback, Fahrenheit, mph, local time, no settings.
- No ads, analytics, login, radar, alerts, or offline requirement.
- Weather-dependent backgrounds; refine visuals after approving layout.

## Status

Nothing is deployed. GitHub Pages is intentionally not enabled. A web app manifest and SVG icon provide groundwork; phone installation and live data integration are later milestones. No service worker is registered, avoiding stale prototype assets.

## Next steps

Review the phone layout, refine artwork, connect forecast and air-quality data with attribution/error states, add geolocation, verify Android installation, then publish only when requested.
