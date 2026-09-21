/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
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
        globPatterns: ['**/*.{js,css,html,json,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/ipapi\.co\//, handler: 'NetworkFirst', options: { cacheName: 'geo', networkTimeoutSeconds: 3 } },
          { urlPattern: /^https:\/\/api\.exchangerate\.host\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'fx' } },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
