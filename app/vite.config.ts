import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/** Strict Content-Security-Policy for the built app (blueprint: Security). Scripts only from the app itself, plus the
 *  one inline theme script by hash; the only outside address the app may call is the Feedback Garden form. */
function csp(): Plugin {
  return {
    name: 'consilia-csp', apply: 'build', enforce: 'post',
    transformIndexHtml(html) {
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
      const policy = [
        "default-src 'self'", `script-src 'self' ${inline.join(' ')}`, "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:", "font-src 'self' data:", "media-src 'self' blob:",
        "connect-src 'self' https://submit.jotform.com https://generativelanguage.googleapis.com", "worker-src 'self' blob:", "manifest-src 'self'",
        "object-src 'none'", "base-uri 'self'", "form-action 'none'", "frame-src 'none'"
      ].join('; ');
      return html.replace(/<meta charset="utf-8" \/>/, `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
    }
  };
}

// Relative base: the same build works at muhdyasykur.github.io/muhdyasykur/, a custom domain, or Netlify.
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  base: './',
  plugins: [
    svelte(),
    csp(),
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
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,webp,woff2,json,webmanifest}'],
        // Text recognition files and tutorial videos are large and optional: fetched on first use, not at install.
        globIgnores: ['ocr/**', 'videos/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Tutorial videos and OCR language data are not in the install. Help and the Textbook Shelf save them on first use;
        // these routes then serve them offline (videos with byte ranges, so seeking works).
        runtimeCaching: [
          { urlPattern: /\/videos\/.+\.(mp4|vtt)$/, handler: 'CacheFirst',
            options: { cacheName: 'consilia-videos', rangeRequests: true, cacheableResponse: { statuses: [200] } } },
          { urlPattern: /\/ocr\/.+/, handler: 'CacheFirst',
            options: { cacheName: 'consilia-ocr', cacheableResponse: { statuses: [200] } } }
        ]
      }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
