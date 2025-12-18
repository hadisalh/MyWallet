import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// تعريف متغير عالمي لتخزين حدث التثبيت
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

/**
 * تسجيل الـ Service Worker لتمكين ميزات الـ PWA (زر التثبيت)
 * يتم استخدام المسار المطلق لضمان العمل في جميع البيئات
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Online PWA Active');
      })
      .catch(err => {
        console.warn('PWA Service Worker registration skipped:', err);
      });
  });
}

// التقاط حدث التثبيت لإظهار الزر المخصص في الواجهة
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable', { detail: true }));
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