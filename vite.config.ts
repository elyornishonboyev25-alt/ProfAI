import { defineConfig } from 'vite'
import { satVocabularyPlugin } from './scripts/lib/sat-vocabulary-plugin.mjs'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    satVocabularyPlugin(),
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script-defer',
      includeAssets: ['logo.svg', 'favicon.svg', 'apple-touch-icon.png', 'brand/*.svg', 'brand/*.png', 'ivygoo-icon-*.png'],
      workbox: {
        // HTML must always come from the server. Precaching index.html can leave
        // an older deployment pointing at JavaScript chunks that no longer
        // exist, which strands the browser on the static boot screen.
        globPatterns: ['logo.svg', 'assets/index-*.css'],
        // Versioned brand URLs must also resolve from the current offline cache.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        // Let existing tabs finish using their current worker and assets.
        // The next document can activate the new deployment.
        skipWaiting: false,
        clientsClaim: false,
        importScripts: ['/sw-cleanup.js'],
      },
      manifest: {
        name: 'IvyGoo',
        short_name: 'IvyGoo',
        description: 'IELTS, SAT and university applications in one learning workspace.',
        lang: 'en',
        id: '/',
        start_url: '/',
        scope: '/',
        theme_color: '#df0030',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/ivygoo-icon-192.png?v=20261027', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/ivygoo-icon-512.png?v=20261027', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
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
      },
      '/ws': {
        target: 'ws://localhost:5001',
        ws: true,
      }
    }
  }
})
