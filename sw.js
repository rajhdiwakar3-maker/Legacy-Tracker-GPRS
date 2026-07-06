// Service worker with an app-shell cache. The app itself talks live to Google
// Apps Script (that traffic always goes to the network), but the shell files
// (HTML, manifest, icons) are cached so the wrapper installs instantly and
// still loads if the network blips.
const CACHE_NAME = 'legacy-tracker-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for the app shell, network-first (pass-through) for everything
// else — in particular the Google Apps Script iframe traffic, which must
// always hit the network live.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShellRequest = event.request.method === 'GET' && url.origin === self.location.origin;

  if (!isShellRequest) {
    // Cross-origin (e.g. script.google.com) — always go live, never cache.
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
