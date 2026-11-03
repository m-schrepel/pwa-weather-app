# Weather / LCD

A phone-first, ad-free weather dashboard for a Samsung Galaxy S24, using live Open-Meteo weather and modeled air quality for **Kirkland, WA 98034**.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173. An HTTP server is required for browser ES modules.

No third-party dependencies, API keys, accounts, or external fonts. The browser calls Open-Meteo directly over HTTPS. Refresh the page or use **Refresh weather** below the forecast to fetch new data. This version uses fixed Kirkland coordinates (47.716, -122.211); device geolocation is a later step.

## Static output and GitHub Pages

Run `node build.mjs` to refresh the standalone output in `docs/`, including `weather.mjs`. Commit the refreshed output whenever changing source. All asset/module paths are relative, so the site works under a GitHub Pages repository URL. Preview the packaged output at http://127.0.0.1:4173/docs/.

After merging into `main`, select **Settings → Pages → Deploy from a branch → main → /docs → Save**. GitHub Pages serves `docs/` at https://m-schrepel.github.io/pwa-weather-app/.

No deployment workflow is required. `.nojekyll` disables Jekyll processing. These source changes do not change Pages settings or publish automatically until merged into the configured publishing branch.

## Data and behavior

- Current conditions, feels-like, wind/gusts: Open-Meteo current model values; Fahrenheit and mph.
- Five daily forecasts: high/low, weather code, maximum precipitation probability.
- Twelve hourly slots: the current forecast hour and the next eleven, with their own weather icons and precipitation probabilities.
- Precipitation card: **maximum hourly probability in those twelve slots**, not an independently calculated twelve-hour event probability. Summary thresholds: below 20% means mostly dry, 20–49% possible, 50%+ likely. The first contiguous period meeting the threshold determines approximate timing. Snow codes change the summary to snow. Missing probabilities never produce a dry-weather claim.
- UV: today's forecast maximum, with category thresholds 3/6/8/11.
- AQI: current modeled US AQI from CAMS via Open-Meteo, labeled with its own valid time; not a local monitoring-station observation. Missing air quality does not block the weather.
- Sunrise/sunset and all dates/times use Pacific time. API epoch timestamps are formatted with `America/Los_Angeles` for DST-aware display.
- Requests time out after 12 seconds. First-load failures show dashes and a retry control, never sample weather. Failed refreshes retain the previous forecast with an explicit update-failed message and its valid time. A forecast older than three hours is labeled older.
- Pixel weather scenes follow current conditions; no sun is drawn for overcast skies. Snow, fog, and thunderstorm icons are supported.

Weather attribution: [Open-Meteo](https://open-meteo.com/). Air-quality attribution: [CAMS](https://atmosphere.copernicus.eu/) via [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api). Visible attribution is included in the app.

## Design and scope

Dark LCD/pixel style; a full-screen lake scene with current weather, detail cards, and a horizontally scrolling five-day forecast. Hourly weather and sunrise/sunset follow below. On short screens the opening section grows to avoid clipping data.

No ads, analytics, login, settings screen, radar, alerts, or offline requirement. No service worker is registered. A manifest and SVG icon provide PWA groundwork; Android installation still needs verification and production-size raster icons.

## Verification

Run `node --test weather.test.mjs`. Tests cover rain timing across midnight, missing values, probability thresholds, AQI/UV categories, condition codes, hourly selection, DST, request units, and HTTP errors. With no third-party packages there are no npm dependencies to audit.
