/* Service worker Hydros — rend le site installable et consultable hors ligne */
var VERSION = 'hydros-2026-09-08';
var FICHIERS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { if (k !== VERSION) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* réseau d'abord, cache en secours : la page reste à jour et fonctionne sans connexion */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && r.status === 200 && r.type === 'basic') {
        var copie = r.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copie); });
      }
      return r;
    })['catch'](function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
