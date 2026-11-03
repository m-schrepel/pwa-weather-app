# Weather / LCD

A phone-first, ad-free weather dashboard for a Samsung Galaxy S24, using live Open-Meteo weather and modeled air quality for **Kirkland, WA 98034**.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173. An HTTP server is required for browser ES modules.

No third-party dependencies, API keys, accounts, or external fonts. The browser calls Open-Meteo directly over HTTPS. Weather updates automatically every 15 minutes while visible, when returning after a minute away, and when connectivity returns. Failed or saved-weather loads retry after a minute. This version uses fixed Kirkland coordinates (47.716, -122.211); device geolocation is a later step.

## Static output and GitHub Pages

Run `node build.mjs` to refresh the standalone output in `docs/`, including `weather.mjs`, the manifest, icons, and a generated service worker. Commit the refreshed output whenever changing source. All asset/module paths are relative, so the site works under a GitHub Pages repository URL. Preview the packaged output at http://127.0.0.1:4173/docs/.

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
- Requests time out after 12 seconds. Without a saved response, first-load failures show dashes and retry automatically, never sample weather. When the service worker has a previously successful response, it uses that as an explicitly labeled saved forecast on network failure. Failed refreshes retain the previous forecast with an explicit update-failed message and its valid time. A forecast older than three hours is labeled older. Offline/cached weather is labeled SAVED FORECAST regardless of age, with its valid date and time in the header (full timestamp available to assistive technology and on hover). Saved hourly/daily data never uses NOW/Today labels.
- Static pixel weather scenes follow current conditions through an explicit weather-code mapping. All 29 documented Open-Meteo codes are covered, including heavy thunderstorm code 97, with day/night variants and fallback art. Snow, fog, and thunderstorm icons are supported.

Weather attribution: [Open-Meteo](https://open-meteo.com/). Air-quality attribution: [CAMS](https://atmosphere.copernicus.eu/) via [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api). Visible attribution is included in the app.

## Design and scope

Dark LCD/pixel style; a full-screen lake scene with current weather, detail cards, and a horizontally scrolling five-day forecast. Hourly weather and a plain sunrise/sunset time row are included in the same opening overview. There is no footer, setup section, or refresh button. Short screens and larger text can grow the page to avoid clipping data.

No ads, analytics, login, settings screen, radar, alerts, or push notifications. Device location remains a later step; the installed app uses Kirkland.

## Verification

Run `node build.mjs`, then `node --test weather.test.mjs pwa.test.mjs backgrounds.test.mjs`. Tests cover rain timing across midnight, missing values, probability thresholds, AQI/UV categories, condition codes, hourly selection, DST, request units, and HTTP errors. With no third-party packages there are no npm dependencies to audit.

## Install on your S24

After merging and waiting for GitHub Pages to finish deployment, open https://m-schrepel.github.io/pwa-weather-app/ in Chrome on the phone. Use the browser menu’s **Install app / Add to Home screen** option. The app opens as a standalone portrait window with a pixel home-screen icon and matching launch colors. Installation must be verified on the physical phone.

The manifest has relative ID/start/scope URLs, standard 192/512px PNG icons, and a separate maskable icon whose artwork stays within the safe area. An Apple touch icon and standalone metadata provide basic support for other phones.

## Offline and updates

- The service worker precaches only the app’s public assets. It uses network-first requests, then falls back to cached assets if needed. It only handles this app’s exact root/index navigation and known asset paths.
- Successful Open-Meteo responses are cached separately, after a request made under service-worker control. A first-ever visit may not yet have saved weather; installing/opening or refreshing while online populates it. Offline weather is a snapshot, not an updated prediction, and is visibly labeled as saved with its valid time in the header. AQI can independently be saved or unavailable.
- The screen requests live weather on load and automatically while in use. The worker allows eight seconds for API requests before attempting saved data; the page has its existing twelve-second overall request timeout. It does not cache failed or incomplete forecast responses over good data.
- `sw.js` is generated from `sw-template.js`. The build hashes all deployable assets and the template to version the app cache automatically. Always run `node build.mjs` after edits; commit both source and refreshed `docs/` output.
- App updates activate while the page is hidden and reload once on return, or activate when all old app windows close. No update controls are shown. Old app caches are cleaned only within the same path’s namespace; weather snapshots survive app updates.
- GitHub Pages serves HTTPS in production; loopback HTTP works for local development. Root and `/docs/` local previews have separate worker/cache scopes. Actual Android installation and airplane-mode behavior still need a device check; worker logic has automated offline tests.

Regenerate icons with `python3 scripts/generate-icons.py`, then rebuild. This reproduces the existing pixel icon using only Python’s standard library; no image-generation service or package installation is needed.

## Weather background assets

Review the library locally at http://127.0.0.1:4173/backgrounds.html. The gallery is excluded from `docs/` and the production cache. The separate gallery filters by condition family and day/night; each card links directly to the SVG files. It is an art-review page rather than part of the phone dashboard’s navigation.

`weather-scenes.mjs` is the shared condition catalog and asset resolver. `backgroundAssets(code, isDay)` returns allowlisted relative paths for a portrait lake scene and the wide temperature-strip backdrop. Unknown codes use neutral fallback assets. Each documented code has its own files, even when it shares a visual family with another intensity.

`assets/weather/` contains **120 static SVGs**: 29 codes × two times of day × two formats, plus four fallback files. The set is about 585 KB uncompressed. Artwork retains the established pixel style and lake silhouette; precipitation density, frozen ground details, haze, lightning, and hail distinguish condition families and intensities. There are no animated flashes. Moon shapes and snow-covered banks are illustrative, not measured moon phases or snow depth.

`node build.mjs` runs `scripts/generate-backgrounds.mjs`, packages all assets into `docs/assets/weather/`, and includes the full library in the versioned service-worker cache so alternate conditions work offline. You can also run `node scripts/generate-backgrounds.mjs` independently. To change art, edit the generator; to change code mappings, edit the shared catalog, then rebuild. No third-party packages or external image-generation services are used.

Background tests verify all documented codes and both day/night variants resolve to existing files, generated source and docs agree, invalid inputs use fallback paths, sun/moon rules are respected, precipitation families have the appropriate layers, and every asset is available to the offline cache. All generated SVGs are also XML-parsed during validation.
