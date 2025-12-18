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
    // استخدام مسار نسبي لضمان التوافق مع جميع الاستضافات
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('PWA: تم تسجيل الـ Service Worker بنجاح:', registration.scope);
      })
      .catch(error => {
        console.warn('PWA: فشل تسجيل الـ Service Worker. قد لا يعمل التثبيت التلقائي.', error.message);
      });
  });
}

// التقاط حدث التثبيت فوراً
window.addEventListener('beforeinstallprompt', (e) => {
  // منع المتصفح من إظهار النافذة التلقائية البسيطة
  e.preventDefault();
  // تخزين الحدث لاستخدامه في واجهتنا المخصصة
  window.deferredPrompt = e;
  // إرسال حدث مخصص لإبلاغ الواجهة بوجود إمكانية للتثبيت
  window.dispatchEvent(new CustomEvent('pwa-installable', { detail: true }));
});

window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  console.log('PWA: تم تثبيت التطبيق بنجاح');
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