import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // mkcert(), // Disabled to prevent ERR_EMPTY_RESPONSE when opening http://localhost:5174
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'E-HCM Attendance',
        short_name: 'E-HCM',
        description: 'E-HCM biometric attendance',
        theme_color: '#4F46E5',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/attendance-leave',
        scope: '/',
        icons: [
          {
            src: '/icons/e-hcm-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/e-hcm-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/e-hcm-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/e-hcm-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
