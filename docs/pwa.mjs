// Installation uses the browser's native UI. Updates apply while the app is away
// and reload once on return, keeping the weather screen free of setup controls.
let registration;
let requestedUpdate = false;
let reloadOnReturn = false;
let reloading = false;
let lastCheck = 0;
function reload() {
  if (!reloading) { reloading = true; window.location.reload(); }
}
function applyWhileHidden() {
  if (!document.hidden || !registration?.active || registration.waiting?.state !== 'installed') return;
  requestedUpdate = true;
  registration.waiting.postMessage({type:'SKIP_WAITING'});
}
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!requestedUpdate) return;
    if (document.hidden) reloadOnReturn = true;
    else reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { applyWhileHidden(); return; }
    if (reloadOnReturn) { reload(); return; }
    if (registration && Date.now() - lastCheck > 15 * 60_000) {
      lastCheck = Date.now();
      registration.update().catch(() => {});
    }
  });
  window.addEventListener('load', async () => {
    try {
      const base = new URL('./', import.meta.url);
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), {scope:base.pathname, updateViaCache:'none'});
      lastCheck = Date.now();
      applyWhileHidden();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') applyWhileHidden();
        });
      });
    } catch {
      // Live weather still works when the browser cannot register a worker.
    }
  });
}
