/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // The PWA/service-worker plugin only belongs in the client build; the SSR
    // bundle (dist-ssr) must not emit a manifest or registration scripts.
    ...(isSsrBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png'],
            manifest: {
              name: 'PC Power Calculator',
              short_name: 'PC Power',
              description: "Estimate your PC's power consumption and electricity cost in any currency.",
              theme_color: '#e5461f',
              background_color: '#0d0b09',
              display: 'standalone',
              orientation: 'any',
              start_url: '/',
            },
            workbox: {
              // No webfonts are shipped (the UI uses the system stack), so the
              // precache is just the app shell, assets and the manifest.
              globPatterns: ['**/*.{js,css,html,json,svg,png,ico,webmanifest}'],
              // Navigations fall back to a shell, not to dist/index.html: that
              // file is the prerendered home page (366 routes are written after
              // Workbox runs), and hydrating it at another URL would mismatch.
              // `scripts/prerender.mjs` writes offline.html from the raw template
              // and this entry precaches it, since it cannot be globbed.
              navigateFallback: 'offline.html',
              navigateFallbackDenylist: [/^\/ads\.txt$/],
              additionalManifestEntries: [{ url: 'offline.html', revision: null }],
              runtimeCaching: [
                // Cache pages the visitor actually opened, so an offline deep
                // link serves its real prerendered HTML instead of the shell.
                {
                  urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'pages',
                    networkTimeoutSeconds: 3,
                    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  },
                },
                { urlPattern: /^https:\/\/ipapi\.co\//, handler: 'NetworkFirst', options: { cacheName: 'geo', networkTimeoutSeconds: 3 } },
              ],
            },
          }),
        ]),
    // `vite preview` serves the SPA fallback before directory indexes, so a
    // prerendered route like /compare would resolve to dist/index.html. nginx
    // in production uses `try_files $uri $uri/ /index.html`, which serves the
    // per-route index.html; mirror that here so `npm run preview` shows the
    // actual prerendered pages.
    {
      name: 'preview-directory-index',
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const [pathname, query] = (req.url ?? '').split('?');
          if (pathname && !pathname.endsWith('/') && !path.extname(pathname)) {
            req.url = `${pathname}/${query !== undefined ? `?${query}` : ''}`;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/component/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
}));
