import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api/tours': {
        target: 'http://tours-service:8010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tours/, '')
      },
      '/api/bookings': {
        target: 'http://booking-service:8020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bookings/, '')
      },
      '/api/messaging': {
        target: 'http://messaging-service:8030',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/messaging/, '')
      },
      '/api/media': {
        target: 'http://media-service:8040',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/media/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})