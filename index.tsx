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
    try {
      // بناء رابط الـ Service Worker بشكل مطلق للتأكد من تطابق الـ Origin
      // هذا يحل مشكلة محاولة التسجيل من دومين ai.studio في بعض المتصفحات
      const swUrl = new URL('sw.js', window.location.href);
      
      navigator.serviceWorker.register(swUrl.href, { scope: './' })
        .then(registration => {
          console.log('SW registered successfully:', registration.scope);
        })
        .catch(error => {
          console.warn('SW registration failed:', error.message);
        });
    } catch (e) {
      console.error('Error constructing SW URL:', e);
    }
  });
}

// التقاط حدث التثبيت فوراً
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