import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dasturchi rejimida (npm run dev) /api/... so'rovlarini NestJS
    // backend'ga (odatda http://localhost:7000) yo'naltiradi, shunda
    // frontend va backend turli portlarda ishlasa ham CORS/manzil
    // muammosi bo'lmaydi.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
