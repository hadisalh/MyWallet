const CACHE_NAME = 'mywallet-v9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './index.tsx',
  './App.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap',
  // تخزين المكتبات الخارجية من الـ Import Map لضمان عملها أوفلاين
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://esm.sh/react-router-dom@^7.11.0',
  'https://esm.sh/lucide-react@^0.562.0',
  'https://esm.sh/recharts@^3.6.0',
  'https://esm.sh/date-fns@^4.1.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(new Request(url, { mode: 'no-cors' })).catch(err => {
            console.warn(`Failed to cache: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // استراتيجية خاصة لصفحة البداية لضمان عمل الـ SPA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html') || caches.match('index.html');
      })
    );
    return;
  }

  // استراتيجية التخزين أولاً للأصول الثابتة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // إذا فشل كل شيء وكان الطلب لملف CSS أو صورة
        if (event.request.destination === 'image') {
          return caches.match('./icon.png');
        }
      });
    })
  );
});