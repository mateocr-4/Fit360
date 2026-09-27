const CACHE_NAME = 'fit360-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/apple-touch-icon-152x152.png',
  './icons/apple-touch-icon-167x167.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/favicon-32x32.png',
  './css/fonts.css',
  './css/fonts/outfit-400.ttf',
  './css/fonts/outfit-500.ttf',
  './css/fonts/outfit-600.ttf',
  './css/fonts/outfit-700.ttf',
  './css/fonts/outfit-800.ttf',
  './css/fonts/outfit-900.ttf',
  './css/fonts/jakarta-400.ttf',
  './css/fonts/jakarta-500.ttf',
  './css/fonts/jakarta-600.ttf',
  './css/fonts/jakarta-700.ttf',
  './css/fonts/jakarta-800.ttf',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/animations.css',
  './js/chart.min.js',
  './js/security.js',
  './js/storage.js',
  './js/exercises-db.js',
  './js/dashboard.js',
  './js/nutrition.js',
  './js/gym.js',
  './js/cardio.js',
  './js/analytics.js',
  './js/settings.js',
  './js/health-sync.js',
  './js/qr-generator.js',
  './js/social.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  // Network-first con fallback a cache para desarrollo y offline garantizado
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('./index.html');
        });
      })
  );
});
