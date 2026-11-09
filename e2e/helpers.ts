import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

export type Fixture = 'munich' | 'cairo' | 'svalbard';

export function fixture(name: Fixture): unknown {
  const path = fileURLToPath(new URL(`./fixtures/${name}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Corners of the plots the fixtures were fetched for, as [lng, lat]. */
export const PLOTS: Record<Fixture, [number, number][]> = {
  munich: [
    [11.564, 48.1478],
    [11.5652, 48.1477],
    [11.5653, 48.1468],
    [11.5649, 48.1463],
    [11.5641, 48.1463],
  ],
  cairo: [
    [31.2352, 30.0449],
    [31.2362, 30.0449],
    [31.2362, 30.0441],
    [31.2352, 30.0441],
  ],
  svalbard: [
    [15.644, 78.2234],
    [15.647, 78.2234],
    [15.647, 78.2226],
    [15.644, 78.2226],
  ],
};

/** ~1.5 km × 1.5 km, over the 1 km² limit. */
export const TOO_LARGE: [number, number][] = [
  [11.5, 48.1],
  [11.52, 48.1],
  [11.52, 48.1135],
  [11.5, 48.1135],
];

export interface MockOptions {
  status?: number;
  body?: unknown;
  delayMs?: number;
}

/** Mocks the back end. Returns a counter of recommendation requests. */
export async function mockApi(page: Page, name: Fixture = 'munich', options: MockOptions = {}): Promise<{ calls: number }> {
  const counter = { calls: 0 };
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }));
  await page.route('**/recommendations/polygon**', async (route) => {
    counter.calls += 1;
    if (options.delayMs) await new Promise((r) => setTimeout(r, options.delayMs));
    await route.fulfill({ status: options.status ?? 200, json: options.body ?? fixture(name) });
  });
  return counter;
}

export async function waitForMap(page: Page): Promise<void> {
  await page.locator('[data-testid="map"] canvas.mapboxgl-canvas').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => (window as any).__hg?.map?.ready === true, null, { timeout: 20_000 });
}

/** Draws a plot through the dev hook: puts the ring in the editor and tells the journey. */
export async function drawPlot(page: Page, corners: [number, number][]): Promise<void> {
  await page.evaluate((c) => {
    const hg = (window as any).__hg;
    const ring = [...c, c[0]];
    hg.map.edit(ring);
    hg.journey.setPlot(ring);
  }, corners);
}
