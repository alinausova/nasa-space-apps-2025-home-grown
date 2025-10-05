import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nasa-space-apps-2025-home-grown/',
  plugins: [tailwindcss(), svelte()],
})
