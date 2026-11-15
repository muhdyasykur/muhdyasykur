import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base: the same build works at muhdyasykur.github.io/muhdyasykur/, a custom domain, or Netlify.
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt', // never swap versions silently mid-lesson
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Consilia — wise planning, meaningful learning',
        short_name: 'Consilia',
        description: 'Offline lesson planning, teaching and PBD tracking for TESL teachers (KSSR).',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F6F7FA',
        theme_color: '#13294B',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // App shell, fonts and the whole curriculum pack are available offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
