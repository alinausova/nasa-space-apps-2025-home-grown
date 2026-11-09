/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nasa-space-apps-2025-home-grown/',
  plugins: [tailwindcss(), svelte()],
  test: {
    // Unit tests only; e2e/ is run by Playwright (npm run e2e).
    include: ['src/**/*.test.ts'],
  },
})
