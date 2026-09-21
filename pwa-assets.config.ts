import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Generate PWA icons (192/512/maskable + favicons) from a single SVG source.
// Run with `npm run generate-pwa-assets`. Outputs land in public/.
export default defineConfig({
  preset,
  images: ['public/icons/icon.svg'],
})
