import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Use /traduttore/ as base when building for production, ./ for dev
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/traduttore/' : '/',
  build: {
    sourcemap: false,
    outDir: '../dist/traduttore',
    rollupOptions: {
      input: {
        multilingueTranslate: new URL('./multilingue-translate.html', import.meta.url).pathname
      }
    }
  },
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
        // DISABLED: Don't precache anything to avoid caching old files
        // globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}']
        globPatterns: []  // Empty - no precaching
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
}))
