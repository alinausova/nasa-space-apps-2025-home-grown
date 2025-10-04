import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nasa-space-apps-2025-home-grown/',
  plugins: [svelte()],
})
