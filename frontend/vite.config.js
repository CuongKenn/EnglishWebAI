// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000', // Đảm bảo rằng mọi yêu cầu bắt đầu bằng /api sẽ được chuyển tiếp đến backend
    }
  }
});
