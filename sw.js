const CACHE_NAME = 'studylog-v46';
const ASSETS = [
  '/',
  '/index.html',
  '/stats.html',
  '/practice.html',
  '/settings.html',
  '/js/storage.js',
  '/js/analytics.js',
  '/js/chapter_validator.js',
  '/js/distribution.js',
  '/js/app.js',
  '/js/stats.js',
  '/js/practice.js',
  '/js/settings.js',
  '/js/graphs.js',
  '/js/history.js',
  '/js/jee_data.js',
  '/js/advice.js',
  '/js/ai_advice.js',
  '/js/chart_check.js',
  '/js/timer.js',
  '/css/main.css',
  '/css/practice.css',
  '/css/stats.css',
  '/css/advice.css',
  '/css/ai_advice.css',
  '/css/timer.css',
  '/manifest.json',
  '/icon.jpeg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});