import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress noisy ECONNABORTED/ECONNRESET from clients closing tabs
            if (!['ECONNABORTED', 'ECONNRESET'].includes(err.code)) {
              console.error('[proxy error]', err.message);
            }
          });
        },
      },
    },
  },
})
