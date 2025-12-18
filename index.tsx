import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// تعريف متغير عالمي لتخزين حدث التثبيت
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// تسجيل الـ Service Worker لدعم الـ PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('تم تسجيل الـ Service Worker بنجاح:', registration.scope);
      })
      .catch(error => {
        console.error('فشل تسجيل الـ Service Worker:', error);
      });
  });
}

// التقاط حدث التثبيت قبل ظهوره التلقائي للسماح لنا بالتحكم فيه
window.addEventListener('beforeinstallprompt', (e) => {
  // منع المتصفح من إظهار النافذة التلقائية
  e.preventDefault();
  // تخزين الحدث ليتم استخدامه لاحقاً من داخل المكونات
  window.deferredPrompt = e;
  // إرسال حدث مخصص لإبلاغ الواجهة بوجود إمكانية للتثبيت
  window.dispatchEvent(new CustomEvent('pwa-installable', { detail: true }));
});

window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  console.log('تم تثبيت تطبيق محفظتي بنجاح على الجهاز');
});

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}