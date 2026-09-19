const CACHE_NAME = 'fisica3-mas-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/notebook.css',
  './css/geogebra.css',
  './css/simulation.css',
  './js/geogebra-plane.js',
  './js/mas-simulation.js',
  './js/mindmap.js',
  './js/notebook-app.js',
  './Imagenes/Portada-vintage.jpg',
  './Imagenes/Hojas-vintage.jpg',
  './Imagenes/Portada.webp',
  './Imagenes/Hojas.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
