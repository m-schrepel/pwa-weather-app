# Weather / LCD

A phone-first, ad-free weather dashboard for a Samsung Galaxy S24, using live Open-Meteo weather and modeled air quality for **Kirkland, WA 98034**.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173. An HTTP server is required for browser ES modules.

No third-party dependencies, API keys, accounts, or external fonts. The browser calls Open-Meteo directly over HTTPS. Refresh the page or use **Refresh weather** below the forecast to fetch new data. This version uses fixed Kirkland coordinates (47.716, -122.211); device geolocation is a later step.

## Static output and GitHub Pages

Run `node build.mjs` to refresh the standalone output in `docs/`, including `weather.mjs`, installation UI, icons, and a generated service worker. Commit the refreshed output whenever changing source. All asset/module paths are relative, so the site works under a GitHub Pages repository URL. Preview the packaged output at http://127.0.0.1:4173/docs/.

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
- Requests time out after 12 seconds. Without a saved response, first-load failures show dashes and a retry control, never sample weather. When the service worker has a previously successful response, it uses that as an explicitly labeled saved forecast on network failure. Failed refreshes retain the previous forecast with an explicit update-failed message and its valid time. A forecast older than three hours is labeled older. Offline/cached weather is labeled SAVED FORECAST regardless of age, with its full valid date and time. Saved hourly/daily data never uses NOW/Today labels.
- Pixel weather scenes follow current conditions; no sun is drawn for overcast skies. Snow, fog, and thunderstorm icons are supported.

Weather attribution: [Open-Meteo](https://open-meteo.com/). Air-quality attribution: [CAMS](https://atmosphere.copernicus.eu/) via [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api). Visible attribution is included in the app.

## Design and scope

Dark LCD/pixel style; a full-screen lake scene with current weather, detail cards, and a horizontally scrolling five-day forecast. Hourly weather and sunrise/sunset follow below. On short screens the opening section grows to avoid clipping data.

No ads, analytics, login, settings screen, radar, alerts, or push notifications. Device location remains a later step; the installed app uses Kirkland.

## Verification

Run `node build.mjs`, then `node --test weather.test.mjs pwa.test.mjs`. Tests cover rain timing across midnight, missing values, probability thresholds, AQI/UV categories, condition codes, hourly selection, DST, request units, and HTTP errors. With no third-party packages there are no npm dependencies to audit.

## Install on your S24

After merging and waiting for GitHub Pages to finish deployment, open https://m-schrepel.github.io/pwa-weather-app/ in Chrome on the phone. Use **Install Weather** at the bottom when the browser offers it, or the browser menu’s **Install app / Add to Home screen** option. The app opens as a standalone portrait window with a pixel home-screen icon and matching launch colors. Some browsers require engagement before exposing the custom install prompt; the menu instructions remain available. Installation must be verified on the physical phone.

The manifest has relative ID/start/scope URLs, standard 192/512px PNG icons, and a separate maskable icon whose artwork stays within the safe area. An Apple touch icon and standalone metadata provide basic support for other phones. Installation controls hide in standalone mode.

## Offline and updates

- The service worker precaches only the app’s public assets. It uses network-first requests, then falls back to cached assets if needed. It only handles this app’s exact root/index navigation and known asset paths.
- Successful Open-Meteo responses are cached separately, after a request made under service-worker control. A first-ever visit may not yet have saved weather; installing/opening or refreshing while online populates it. Offline weather is a snapshot, not an updated prediction, and is visibly labeled as saved with a full valid timestamp. AQI can independently be saved or unavailable.
- The first screen still tries live weather every load/refresh. The worker allows eight seconds for API requests before attempting saved data; the page has its existing twelve-second overall request timeout. It does not cache failed or incomplete forecast responses over good data.
- `sw.js` is generated from `sw-template.js`. The build hashes all deployable assets and the template to version the app cache automatically. Always run `node build.mjs` after edits; commit both source and refreshed `docs/` output.
- Updates wait until the user taps **Update Weather**, or until all old app windows close. Tapping Update activates the waiting worker and reloads once. It does not interrupt an open page automatically. Old app caches are cleaned only within the same path’s namespace; weather snapshots survive app updates.
- GitHub Pages serves HTTPS in production; loopback HTTP works for local development. Root and `/docs/` local previews have separate worker/cache scopes. Actual Android installation and airplane-mode behavior still need a device check; worker logic has automated offline tests.

Regenerate icons with `python3 scripts/generate-icons.py`, then rebuild. This reproduces the existing pixel icon using only Python’s standard library; no image-generation service or package installation is needed.
