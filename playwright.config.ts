import { defineConfig, devices } from '@playwright/test';

// Local end-to-end checks. Needs VITE_MAPBOX_ACCESS_TOKEN in .env (the map is real; the API is mocked).
const PORT = 5173;
const BASE = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.output',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    // Mapbox needs WebGL; headless Chromium provides it via SwiftShader.
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
