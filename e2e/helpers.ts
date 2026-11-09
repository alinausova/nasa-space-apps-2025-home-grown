import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

export type Fixture = 'munich' | 'cairo' | 'svalbard';
export type Part = 'climate' | 'crops' | 'summary';

/** Real v2 API responses saved in e2e/fixtures/v2/. */
export function v2(name: Fixture, part: Part): any {
  const path = fileURLToPath(new URL(`./fixtures/v2/${name}-${part}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Usable crops in ranking order, as the results list shows them. */
export function usable(name: Fixture): any[] {
  return v2(name, 'crops').crops.filter((c: any) => c.usable);
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

export interface CallMock {
  status?: number;
  body?: unknown;
  delayMs?: number;
}

export interface MockOptions {
  /** Shorthand for slowing the crops call (the long one). */
  delayMs?: number;
  climate?: CallMock;
  crops?: CallMock;
  summary?: CallMock;
}

/** Mocks the back end's three analysis calls from the fixtures. Returns call counters. */
export async function mockApi(page: Page, name: Fixture = 'munich', options: MockOptions = {}): Promise<Record<Part, number>> {
  const counter: Record<Part, number> = { climate: 0, crops: 0, summary: 0 };
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }));
  await page.route('**/search/geocode/v6/reverse**', (route) =>
    route.fulfill({
      json: {
        features: [{ properties: { context: { neighborhood: { name: 'Maxvorstadt' }, place: { name: 'Munich' } } } }],
      },
    }),
  );
  for (const part of ['climate', 'crops', 'summary'] as const) {
    const mock: CallMock = { ...(part === 'crops' && options.delayMs ? { delayMs: options.delayMs } : {}), ...options[part] };
    await page.route(`**/analysis/${part}`, async (route) => {
      counter[part] += 1;
      if (mock.delayMs) await new Promise((r) => setTimeout(r, mock.delayMs));
      await route.fulfill({ status: mock.status ?? 200, json: mock.body ?? v2(name, part) });
    });
  }
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
