const install = document.getElementById('install-app');
const update = document.getElementById('update-app');
const section = document.getElementById('pwa-controls');
const status = document.getElementById('pwa-status');
const help = document.getElementById('install-help');
const standalone = window.matchMedia('(display-mode: standalone)');
let promptEvent = null;
let registration = null;
let requestedUpdate = false;
let reloading = false;

function installed() {
  return standalone.matches || navigator.standalone === true;
}
function syncInstall() {
  install.hidden = installed() || !promptEvent;
  help.hidden = installed() || Boolean(promptEvent);
  section.hidden = installed() && update.hidden;
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  promptEvent = event;
  syncInstall();
});
window.addEventListener('appinstalled', () => {
  promptEvent = null;
  install.hidden = true;
  help.hidden = true;
  status.textContent = 'Weather is installed on your home screen.';
});
standalone.addEventListener('change', syncInstall);
install.addEventListener('click', async () => {
  if (!promptEvent) return;
  const pending = promptEvent;
  promptEvent = null;
  install.disabled = true;
  try {
    await pending.prompt();
    await pending.userChoice;
  } catch {
    status.textContent = 'Use your browser menu to install Weather.';
  } finally {
    install.disabled = false;
    syncInstall();
  }
});
function showUpdate() {
  if (!registration?.active || registration.waiting?.state !== 'installed') return;
  update.hidden = false;
  section.hidden = false;
  status.textContent = 'A new version is ready.';
}
update.addEventListener('click', () => {
  if (!registration?.waiting) return;
  requestedUpdate = true;
  update.disabled = true;
  registration.waiting.postMessage({type:'SKIP_WAITING'});
});
syncInstall();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (requestedUpdate && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });
  window.addEventListener('load', async () => {
    try {
      const base = new URL('./', import.meta.url);
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), {scope:base.pathname, updateViaCache:'none'});
      showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
        });
      });
      await navigator.serviceWorker.ready;
      if (update.hidden) status.textContent = 'Ready for your home screen. Opens even when offline.';
    } catch {
      status.textContent = 'Weather works in your browser. Offline support is unavailable here.';
    }
  });
} else {
  status.textContent = 'Open the HTTPS site in your phone’s browser to install Weather.';
}
