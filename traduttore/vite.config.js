import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      injectManifest: {
        // include hashed assets so worker can precache the worker + model-related files
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}']
      },
      manifest: {
        name: 'Traduzioni Ldm4app',
        short_name: 'Ldm4app',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5a4',
        icons: [
          { src: 'pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ]
})
