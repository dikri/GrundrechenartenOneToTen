const CACHE_NAME = 'leo-einmaleins-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'
];

// Install: Cache die Kern-Dateien
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: Alte Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first für API-Calls, Cache-first für statische Assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API-Aufrufe und Bilder: Network first, dann Cache
  if (url.hostname === 'pokeapi.co' ||
      url.hostname === 'raw.githubusercontent.com' ||
      url.hostname === 'cdn.brawlify.com' ||
      url.hostname === 'api.brawlapi.com') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Alles andere: Cache first, dann Network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
