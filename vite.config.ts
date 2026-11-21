/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

/**
 * Emit search-engine verification tags only when the matching build variable
 * is set. Returning no tag (rather than an empty `content`) keeps a build
 * without credentials free of blank verification tags.
 */
function searchEngineVerification(env: Record<string, string>): Plugin {
  return {
    name: 'search-engine-verification',
    transformIndexHtml(html) {
      const tags: HtmlTagDescriptor[] = [];
      const gsc = env.VITE_GSC_VERIFICATION?.trim();
      const bing = env.VITE_BING_VERIFICATION?.trim();
      if (gsc) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'google-site-verification', content: gsc },
          injectTo: 'head',
        });
      }
      if (bing) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'msvalidate.01', content: bing },
          injectTo: 'head',
        });
      }
      return { html, tags };
    },
  };
}

export default defineConfig(({ isSsrBuild, mode }) => {
  // `loadEnv` merges `.env*` files with an inline/shell VITE_* variable, so the
  // same plugin works for local builds and for deployment-time values.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      tailwindcss(),
      searchEngineVerification(env),
      // The PWA/service-worker plugin only belongs in the client build; the SSR
      // bundle (dist-ssr) must not emit a manifest or registration scripts.
      ...(isSsrBuild
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icons/favicon.ico', 'icons/apple-touch-icon-180x180.png', 'brand/logo.png'],
              manifest: {
                name: 'PC Power Calculator',
                short_name: 'PC Power',
                description: "Estimate your PC's power consumption and electricity cost in any currency.",
                theme_color: '#e5461f',
                background_color: '#0d0b09',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                id: '/',
                // Without an icons array the manifest is valid but NOT
                // installable: Chrome requires a 192 and a 512 px icon before it
                // will offer the install prompt, however good the service worker.
                icons: [
                  { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                  { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                  {
                    src: '/icons/maskable-icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                  { src: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
                ],
                categories: ['utilities', 'productivity'],
              },
              workbox: {
                // woff2 is precached so the installed app keeps its typeface
                // offline instead of reflowing to a system fallback. The report's
                // embedded fonts are static TTFs fetched at export time.
                globPatterns: ['**/*.{js,css,html,json,svg,png,ico,woff2,ttf,webmanifest}'],
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
    // `npm run dev` proxies the mail API to the locally running
    // `node server/mail.mjs`, mirroring nginx in production.
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false },
      },
    },
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
  };
});
