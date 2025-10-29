// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000', // Proxy API requests to backend
      '/media': 'http://localhost:8000', // Proxy media files (audio, images, etc.) to backend
    }
  }
});
