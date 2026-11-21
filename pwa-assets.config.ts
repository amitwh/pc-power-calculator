import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Generate PWA icons (192/512/maskable + favicons) from the supplied app icon.
// Run with `npm run generate-pwa-assets`. Outputs land beside the source.
export default defineConfig({
  preset,
  images: ['public/icons/appicon.png'],
})
