/* ═══════════════════════════════════════════
   sw.js — Service Worker de Refugio
   Caché offline para el app shell
═══════════════════════════════════════════ */

const CACHE  = 'refugio-v3';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'js/app.js',
  'js/db.js',
  'js/garden.js',
  'js/ai.js',
  'icons/icon-192.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Cache-first para app shell, network-first para API */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Siempre red para Anthropic API */
  if (url.hostname === 'api.anthropic.com') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
