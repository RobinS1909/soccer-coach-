// Service Worker: macht die App offline nutzbar.
// Bei jeder Änderung an Dateien VERSION erhöhen, damit Handys die neue Version laden.
const VERSION = 'sc-v9';
const DATEIEN = [
  './', 'index.html', 'css/app.css', 'config.js', 'manifest.webmanifest',
  'js/app.js', 'js/api.js', 'js/kind.js', 'js/trainer.js', 'js/regeln.js', 'js/abzeichen.js', 'js/skizze.js', 'js/speicher.js', 'js/util.js', 'js/demo.js', 'js/trainer-daten.js',
  'data/uebungen.json', 'icons/logo-klein.png', 'icons/logo.png', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Datenbank-Anfragen nie cachen
  // Erst Netz (damit neue Übungen sofort da sind), sonst Cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const kopie = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, kopie));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
