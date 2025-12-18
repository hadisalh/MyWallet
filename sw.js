const CACHE_NAME = 'mywallet-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap',
  // المكتبات الأساسية (يجب أن تتطابق تماماً مع ما في الـ importmap)
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://esm.sh/react-router-dom@^7.11.0',
  'https://esm.sh/lucide-react@^0.562.0',
  'https://esm.sh/recharts@^3.6.0',
  'https://esm.sh/date-fns@^4.1.0',
  'https://esm.sh/@google/genai@^1.34.0'
];

// التثبيت: تخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نستخدم fetch عادي بدون no-cors للسماح بتشغيل الـ Modules
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          return fetch(url).then(response => {
            if (response.ok) return cache.put(url, response);
            throw new Error(`Failed to fetch ${url}`);
          }).catch(err => console.warn('Install cache failed for:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// التنشيط: تنظيف النسخ القديمة
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

// المعالجة: استراتيجية Network First للملاحة و Cache First للأصول
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // لطلبات الصفحة الرئيسية (الملاحة)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // للأصول الأخرى (JS, CSS, Images)
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
        // Fallback للصور
        if (event.request.destination === 'image') {
          return caches.match('./icon.png');
        }
      });
    })
  );
});