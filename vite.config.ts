
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // هذا السطر يضمن استبدال أي إشارة لـ process.env.API_KEY بالقيمة الفعلية من Vercel أثناء البناء
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react', 'date-fns']
        }
      }
    }
  }
});
