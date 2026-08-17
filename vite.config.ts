import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['logo.svg'],
      workbox: {
        globPatterns: ['index.html', 'logo.svg', 'assets/index-*.css'],
        cleanupOutdatedCaches: true,
        importScripts: ['/sw-cleanup.js'],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-dom') || /node_modules[\\/]react[\\/]/.test(id)) return 'vendor-react'
          if (id.includes('zustand')) return 'vendor-state'
          if (id.includes('i18next')) return 'vendor-i18n'
          return undefined
        },
      },
    },
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
