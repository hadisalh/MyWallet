// Minimal Service Worker for Online-First PWA
// This satisfies the "installable" requirement without caching assets.

self.addEventListener('install', (event) => {
  // تفعيل الـ Service Worker فوراً بعد التثبيت
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // التحكم في المتصفح فور التنشيط
  event.waitUntil(self.clients.claim());
});

// معالجة الطلبات: تمرير مباشر للشبكة دون تدخل
self.addEventListener('fetch', (event) => {
  // لا نقوم بعمل أي Cache، فقط نطلب من الإنترنت مباشرة
  // هذا يضمن أن التطبيق يعمل دائماً بأحدث نسخة من السيرفر
  event.respondWith(fetch(event.request));
});