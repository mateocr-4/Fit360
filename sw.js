const CACHE_NAME = 'fit360-v5';
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
  './js/storage.js',
  './js/exercises-db.js',
  './js/dashboard.js',
  './js/nutrition.js',
  './js/gym.js',
  './js/cardio.js',
  './js/analytics.js',
  './js/settings.js',
  './js/health-sync.js',
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

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback si no hay conexión y no está en caché
        return caches.match('./index.html');
      });
    })
  );
});
