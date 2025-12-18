
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // نستخدم الجذر كمجلد للملفات العامة لضمان نسخ manifest.json و sw.js و icon.png
  publicDir: './', 
  define: {
    // هذا السطر يضمن استبدال أي إشارة لـ process.env.API_KEY بالقيمة الفعلية من Vercel أثناء البناء
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react', 'date-fns']
        }
      }
    }
  },
  server: {
    // تمت إزالة historyApiFallback لأن Vite يدعمها تلقائياً في التطبيقات أحادية الصفحة (SPA)
    // ولأنها تسبب خطأ في تعريفات الأنواع (TypeScript error TS2769)
  }
});
