/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), svelte()],
  build: {
    rollupOptions: {
      output: {
        // Mapbox rarely changes; its own chunk stays cached across our releases.
        manualChunks: { mapbox: ['mapbox-gl', '@mapbox/mapbox-gl-draw'] },
      },
    },
    // mapbox-gl alone is ~1.6 MB minified; it only loads on the map screens.
    chunkSizeWarningLimit: 1800,
  },
  test: {
    // Unit tests only; e2e/ is run by Playwright (npm run e2e).
    include: ['src/**/*.test.ts'],
  },
})
