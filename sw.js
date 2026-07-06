// Minimal service worker — required for the site to qualify as an installable
// PWA (and therefore packageable as a Trusted Web Activity APK). This app is
// fully online-dependent (it talks to Google Apps Script live), so we don't
// attempt real offline caching — we just need the service worker present and
// registered for browsers/PWABuilder to treat this as a valid PWA.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch — always go to the network, no offline caching, since
// the app requires a live connection to the Apps Script backend anyway.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
