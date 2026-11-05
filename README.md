# Weather / Watercolor

A phone-first, ad-free weather dashboard for a Samsung Galaxy S24, using live Open-Meteo weather and modeled air quality for your current location, with **Kirkland, WA 98034** as the fallback.

## Preview locally

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173. An HTTP server is required for browser ES modules.

No third-party dependencies, API keys, accounts, or external fonts. The browser calls Open-Meteo directly over HTTPS. Weather updates automatically every 15 minutes while visible, when returning after a minute away, and when connectivity returns. Failed or saved-weather loads retry after a minute. On startup and each refresh, the app requests a device location fix (up to five minutes old). Allow the browser’s location prompt to see local weather. The home screen shows the detected city and region, plus an accessible crosshair icon button to retry. A best-effort browser request to BigDataCloud’s key-free city reverse-geocoding API sends the device coordinates rounded to three decimals; the name is retained only in memory for the current location. The lookup times out after four seconds and does not block weather loading. If it fails or returns no locality, the row falls back to “Current location” and rounded coordinates. City lookup documentation: https://www.bigdatacloud.com/docs/free-api/free-reverse-geocode-to-city-api. Denied, unavailable, or unanswered requests use an explicitly labeled Kirkland fallback (47.716, -122.211), or the last detected location while the app remains open. If access is blocked, enable location in browser/site settings before retrying. Location acquisition is bounded to twelve seconds; no continuous GPS tracking or separate location storage is used. Rounded coordinates are sent to Open-Meteo and included in the existing per-request offline weather cache.

## Static output and GitHub Pages

Run `node build.mjs` to refresh the standalone output in `docs/`, including `weather.mjs`, the manifest, icons, and a generated service worker. Commit the refreshed output whenever changing source. All asset/module paths are relative, so the site works under a GitHub Pages repository URL. Preview the packaged output at http://127.0.0.1:4173/docs/.

After merging into `main`, select **Settings → Pages → Deploy from a branch → main → /docs → Save**. GitHub Pages serves `docs/` at https://m-schrepel.github.io/pwa-weather-app/.

No deployment workflow is required. `.nojekyll` disables Jekyll processing. These source changes do not change Pages settings or publish automatically until merged into the configured publishing branch.

## Data and behavior

The status bar shows **Forecast as of** followed by the latest successful weather pull time in the forecast location’s timezone. This is the fetch time, not the model valid time; saved, older, and failed updates retain explicit status labels.

- Current conditions, feels-like, wind/gusts: Open-Meteo current model values; Fahrenheit and mph.
- Five daily forecasts: high/low, weather code, maximum precipitation probability.
- Twelve hourly slots: the current forecast hour and the next eleven, with their own weather icons and precipitation probabilities.
- Precipitation card: **maximum hourly probability in those twelve slots**, not an independently calculated twelve-hour event probability. Summary thresholds: below 20% means mostly dry, 20–49% possible, 50%+ likely. The first contiguous period meeting the threshold determines approximate timing. Snow codes change the summary to snow. Missing probabilities never produce a dry-weather claim.
- UV: today's forecast maximum, with category thresholds 3/6/8/11.
- AQI: current modeled US AQI from CAMS via Open-Meteo, labeled with its own valid time; not a local monitoring-station observation. Missing air quality does not block the weather.
- Sunrise/sunset, rain timing, and all dates/times use the forecast timezone returned by Open-Meteo (`timezone=auto` for device coordinates), including DST. The Kirkland fallback uses `America/Los_Angeles`.
- Requests time out after 12 seconds. Without a saved response, first-load failures show dashes and retry automatically, never sample weather. When the service worker has a previously successful response, it uses that as an explicitly labeled saved forecast on network failure. Failed refreshes retain the previous forecast with an explicit update-failed message. A forecast older than three hours is labeled older. Offline/cached weather is labeled SAVED FORECAST regardless of age, with its valid timestamp available on the status label to assistive technology and on hover. Saved hourly/daily data never uses NOW/Today labels.
- Static composable weather layers over a watercolor Pacific Northwest landscape follow current conditions through an explicit weather-code mapping. All 29 documented Open-Meteo codes are covered, including heavy thunderstorm code 97, with day/night variants and fallback art. Snow, fog, and thunderstorm icons are supported.

Weather attribution: [Open-Meteo](https://open-meteo.com/). Air-quality attribution: [CAMS](https://atmosphere.copernicus.eu/) via [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api). Visible attribution is included in the app.

## Design and scope

Watercolor-and-pencil style; a full-screen Moss Bay view interpreted from the Marina Park pavilion area in Kirkland with current weather, detail cards, and a horizontally scrolling five-day forecast. Hourly weather and a plain sunrise/sunset time row are included in the same opening overview. The location row sits above current conditions. There is no footer or setup section. Short screens and larger text can grow the page to avoid clipping data.

No ads, analytics, login, settings screen, radar, alerts, or push notifications. Device location requires browser permission and HTTPS (or localhost during development).

## Verification

Run `node build.mjs`, then `node --test weather.test.mjs location.test.mjs pwa.test.mjs backgrounds.test.mjs`. Tests cover location permission errors, retries, coordinate validation, API location parameters, travel without stale weather, local timezone formatting, rain timing across midnight, missing values, probability thresholds, AQI/UV categories, condition codes, hourly selection, DST, request units, and HTTP errors. With no third-party packages there are no npm dependencies to audit.

## Install on your S24

After merging and waiting for GitHub Pages to finish deployment, open https://m-schrepel.github.io/pwa-weather-app/ in Chrome on the phone. Use the browser menu’s **Install app / Add to Home screen** option. The app opens as a standalone portrait window with a pixel home-screen icon and matching launch colors. Installation must be verified on the physical phone.

The manifest has relative ID/start/scope URLs, standard 192/512px PNG icons, and a separate maskable icon whose artwork stays within the safe area. An Apple touch icon and standalone metadata provide basic support for other phones.

## Offline and updates

- The service worker precaches only the app’s public assets. It uses network-first requests, then falls back to cached assets if needed. It only handles this app’s exact root/index navigation and known asset paths.
- Successful Open-Meteo responses are cached separately, after a request made under service-worker control. A first-ever visit may not yet have saved weather; installing/opening or refreshing while online populates it. Offline weather is a snapshot, not an updated prediction, and is visibly labeled as saved with its valid timestamp available on the status label to assistive technology and on hover. AQI can independently be saved or unavailable.
- The screen requests live weather on load and automatically while in use. The worker allows eight seconds for API requests before attempting saved data; the page has its existing twelve-second overall request timeout. It does not cache failed or incomplete forecast responses over good data.
- `sw.js` is generated from `sw-template.js`. The build hashes all deployable assets and the template to version the app cache automatically. Always run `node build.mjs` after edits; commit both source and refreshed `docs/` output.
- App updates activate while the page is hidden and reload once on return, or activate when all old app windows close. No update controls are shown. Old app caches are cleaned only within the same path’s namespace; weather snapshots survive app updates.
- GitHub Pages serves HTTPS in production; loopback HTTP works for local development. Root and `/docs/` local previews have separate worker/cache scopes. Actual Android installation and airplane-mode behavior still need a device check; worker logic has automated offline tests.

Regenerate icons with `python3 scripts/generate-icons.py`, then rebuild. This reproduces the existing pixel icon using only Python’s standard library; no image-generation service or package installation is needed.

## Weather artwork and composable layers

Review locally at http://127.0.0.1:4173/backgrounds.html. This development gallery is excluded from `docs/` and the production cache. Filters show condition families and day/night; each scene links to its landscape JPEG and transparent weather SVG.

`assets/landscape/` contains two original 1024 × 1536 watercolor-and-pencil Pacific Northwest lake canvases, optimized as JPEGs. Both have quiet, empty skies. The same low distant urban shoreline, left-side marina and pier, open water and curved foreground seawall stay in place while the weather changes. The view is an informed interpretation of the west-facing pavilion area, not an exact surveyed camera position. `artwork/` records the generation prompts and design notes. The launcher icons retain their existing pixel artwork.

`weather-scenes.mjs` is the shared condition catalog and allowlisted resolver. `backgroundAssets(code, isDay)` returns a shared day/night landscape and the matching transparent atmosphere layer. Unknown codes use an empty weather layer rather than inventing conditions. `scripts/generate-backgrounds.mjs` builds 60 lightweight SVG layers: 29 codes plus fallback, each by day and night. Sun, moon/stars, organic cloud washes, fog bands, drizzle/rain, snow/grains, freezing precipitation, static lightning and hail compose according to the existing code and intensity. Showers have gaps and heavier precipitation has denser marks. Moon shape and edge frost are illustrative; the artwork does not claim measured moon phase, ground ice or snow depth. There is no snowfall accumulation on the base image.

The landscape and atmosphere are separate image elements, so changing weather does not reload the shared landscape. The layers use static paths and gradients with no animation, flashing, filters, JavaScript or external resources. Reduced-motion users see the same static artwork. Text panels and shading keep data readable across day/night conditions. `weather-icons.mjs` supplies fourteen scalable watercolor-wash symbols, including separate clear/partly cloudy day and night variants, freezing rain and hail.

`node build.mjs` regenerates the layers and packages both canvases, all layers, the icon renderer and styles into the versioned offline cache. The complete artwork is under 1 MB. No third-party packages or live image-generation services are needed to build or run the app.

Tests verify all weather codes and both periods, correct layer combinations, no sun in overcast/rain/night art, moon and stars for open night skies, intensity differences, safe unknown inputs, complete offline coverage, and source/docs parity. All generated SVGs are XML-validated during development. Run the four test files listed above after rebuilding.

The location control is a native button with a crosshair SVG, a transparent 44 × 44 CSS-pixel hit target, a visible keyboard focus ring, an accessible name and a tooltip. It keeps the existing permission, loading and retry behavior.
