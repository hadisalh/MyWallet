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
 * تسجيل الـ Service Worker لدعم الـ PWA
 * تم تحسين الكود ليكون أكثر مرونة مع البيئات المختلفة
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // نستخدم محاولة/خطأ لمنع تعطل التطبيق بالكامل في حال فشل تسجيل الـ Service Worker
    try {
      // نستخدم مساراً نسبياً بسيطاً وهو الخيار الأكثر أماناً وتوافقاً
      const swPath = './sw.js';
      
      navigator.serviceWorker.register(swPath, { scope: './' })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          // تسجيل الخطأ كتحذير فقط لضمان استمرار عمل الواجهة الرئيسية
          console.warn('Service Worker registration skipped:', error.message);
        });
    } catch (e) {
      console.warn('Browser does not support Service Worker registration in this context.');
    }
  });
}

// التقاط حدث التثبيت فوراً (لإظهار زر التثبيت لاحقاً)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  // إبلاغ المكونات بأن التطبيق جاهز للتثبيت
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