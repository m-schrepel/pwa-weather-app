# Weather / LCD prototype

A phone-first, ad-free weather PWA for a Samsung Galaxy S24. This first version is a **local design prototype with illustrative Kirkland, WA data**, not a live forecast.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173.

No dependencies, compilation requirement, API keys, accounts, or external fonts. The condition buttons at the bottom compare cloudy, rainy, clear, and nighttime scenes using sample data.

## Static output and GitHub Pages

Run `node build.mjs` to refresh the standalone output in `docs/`. It contains the HTML, CSS, JavaScript, manifest, icon, and `.nojekyll` file, with relative paths so it works under a GitHub Pages repository URL. Commit the refreshed output whenever changing the root source files. You can preview it locally at http://127.0.0.1:4173/docs/.

After merging into `main`, select **Settings → Pages → Deploy from a branch → main → /docs → Save**. GitHub Pages serves the contents of `docs/` at https://m-schrepel.github.io/pwa-weather-app/.

No deployment workflow is required. `.nojekyll` disables Jekyll processing. Publishing is left to the repository owner; this change does not enable Pages.

## Design brief

- Phone only, primarily Galaxy S24; dark LCD/pixel style.
- A full-screen pixel weather scene with current conditions, today's high/low, and feels-like overlaid on the image; scroll for the forecast.
- A horizontal five-day forecast directly below the first-screen detail cards; the next 12 hours further down the scrolling page.
- Compact rain chance, wind/gusts, UV, and US AQI cards directly beneath current weather on the first screen; sunrise and sunset further down.
- Future live version: current location, Kirkland (98034) fallback, Fahrenheit, mph, local time, no settings.
- No ads, analytics, login, radar, alerts, or offline requirement.
- Weather-dependent backgrounds; refine visuals after approving layout.

## Status

Nothing is deployed. GitHub Pages is intentionally not enabled. A web app manifest and SVG icon provide groundwork; phone installation and live data integration are later milestones. No service worker is registered, avoiding stale prototype assets.

## Next steps

Review the phone layout, refine artwork, connect forecast and air-quality data with attribution/error states, add geolocation, verify Android installation, then publish only when requested.
