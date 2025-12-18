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
 * تسجيل الـ Service Worker بطريقة تضمن التوافق مع مسارات الـ PWA
 */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // استخدام مسار كامل مستخلص من موقع الملف الحالي لتجنب مشاكل الـ Origin
      const swUrl = new URL('./sw.js', import.meta.url).href;
      const registration = await navigator.serviceWorker.register(swUrl, { 
        scope: './',
        updateViaCache: 'none'
      });
      console.log('SW Registered:', registration.scope);
    } catch (error) {
      console.warn('SW registration failed, application will run in online-only mode:', error);
    }
  }
};

// تشغيل التسجيل
registerServiceWorker();

// التقاط حدث التثبيت
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