import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg'],
      workbox: {
        globPatterns: ['index.html', 'logo.svg', 'assets/index-*.css'],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              url.origin === self.location.origin &&
              (request.destination === 'script' || request.destination === 'style'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'profai-app-assets',
              expiration: {
                maxEntries: 180,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'ProfAI',
        short_name: 'ProfAI',
        description: 'SAT va IELTS uchun shaxsiy AI repetitor va premium analytics platformasi',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.svg',
            sizes: '120x120',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
})
