import { describe, expect, it, vi } from 'vitest';
import type { LngLat } from '../api/recommendations';
import type { AnalysisApi, ClimateResponse, CropsResponse } from '../api/analysis';
import { Journey, MAX_AREA_M2, plotFromRing } from './journey.svelte';

// ~100 m × 100 m square in Munich.
const SMALL: LngLat[] = [
  [11.56, 48.14],
  [11.56135, 48.14],
  [11.56135, 48.1409],
  [11.56, 48.1409],
  [11.56, 48.14],
];

// ~1.5 km × 1.5 km, over the limit.
const LARGE: LngLat[] = [
  [11.5, 48.1],
  [11.52, 48.1],
  [11.52, 48.1135],
  [11.5, 48.1135],
  [11.5, 48.1],
];

const CLIMATE = {
  plot_id: 'p1',
  location: { center_latitude: 48.14, center_longitude: 11.56, area_m2: 10_000, area_hectares: 1 },
  year: 2025,
  climate: { avg_temp_max: 14, avg_temp_min: 5, annual_precipitation_mm: 900, sun_hours_daily: 6, sunshine_factor: 0.7, growing_season: null, warmest_month: null, days_above_5c: 250, winter_sun_hours: 2 },
  monthly: [],
} as ClimateResponse;
const CROPS = { plot_id: 'p1', landsat: { status: 'ok', scenes: [], surface_heat: null }, crops: [], total_usable: 0 } as CropsResponse;

/** Fake API with call log; each method resolves immediately unless overridden. */
function api(overrides: Partial<AnalysisApi> = {}) {
  const calls: string[] = [];
  const impl: AnalysisApi = {
    climate: vi.fn(async () => (calls.push('climate'), CLIMATE)),
    crops: vi.fn(async () => (calls.push('crops'), CROPS)),
    summary: vi.fn(async () => (calls.push('summary'), { plot_id: 'p1', summary: 'Grow kale.' })),
    ...overrides,
  };
  return { impl, calls };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('plotFromRing', () => {
  it('measures area and counts corners once', () => {
    const plot = plotFromRing(SMALL);
    expect(plot.corners).toBe(4);
    expect(plot.areaM2).toBeGreaterThan(9_000);
    expect(plot.areaM2).toBeLessThan(11_000);
  });

  it('closes open rings', () => {
    const plot = plotFromRing(SMALL.slice(0, 4));
    expect(plot.ring).toHaveLength(5);
    expect(plot.corners).toBe(4);
  });
});

describe('Journey', () => {
  it('moves from place to draw when a plot appears', () => {
    const journey = new Journey(api().impl);
    journey.setPlot(SMALL);

    expect(journey.step).toBe('draw');
    expect(journey.canAnalyse).toBe(true);
  });

  it('blocks plots over the limit', () => {
    const journey = new Journey(api().impl);
    journey.setPlot(LARGE);

    expect(journey.plot!.areaM2).toBeGreaterThan(MAX_AREA_M2);
    expect(journey.isTooLarge).toBe(true);
    expect(journey.canAnalyse).toBe(false);
  });

  it('keeps the place name when the plot is redrawn', () => {
    const journey = new Journey(api().impl);
    journey.setPlot(SMALL);
    journey.setPlaceName('Maxvorstadt, Munich');
    journey.setPlot(SMALL.slice(0, 4));

    expect(journey.plot!.placeName).toBe('Maxvorstadt, Munich');
  });

  it('undo walks back through edits, including a delete', () => {
    const journey = new Journey(api().impl);
    const smaller = SMALL.slice(0, 3).concat([SMALL[0]]);
    journey.setPlot(SMALL);
    journey.setPlot(smaller);
    journey.setPlot(null);

    expect(journey.undo()).toEqual(smaller);
    expect(journey.plot!.corners).toBe(3);
    expect(journey.undo()).toEqual(SMALL);
    expect(journey.undo()).toBeNull();
    expect(journey.plot).toBeNull();
    expect(journey.canUndo).toBe(false);
  });

  it('climate, then crops, then results; the summary arrives after', async () => {
    const { impl, calls } = api();
    const journey = new Journey(impl);
    journey.setPlot(SMALL);

    const pending = journey.analyse();
    expect(journey.step).toBe('analysing');
    expect(journey.request).toMatchObject({ status: 'loading', phase: 'climate' });

    await pending;
    expect(calls.slice(0, 2)).toEqual(['climate', 'crops']);
    expect(journey.step).toBe('results');
    expect(journey.results).not.toBeNull();
    await flush();
    expect(journey.summary).toEqual({ status: 'done', text: 'Grow kale.' });
    expect(journey.results!.llm_summary).toBe('Grow kale.');
  });

  it('reports which call failed', async () => {
    const journey = new Journey(api({ crops: vi.fn().mockRejectedValue(new Error('Landsat did not answer')) }).impl);
    journey.setPlot(SMALL);
    await journey.analyse();

    expect(journey.step).toBe('analysing');
    expect(journey.request).toEqual({ status: 'error', phase: 'crops', message: 'Landsat did not answer' });
    expect(journey.climate).not.toBeNull();
  });

  it('retry keeps the climate and starts from the crops', async () => {
    let fail = true;
    const { impl, calls } = api({
      crops: vi.fn(async () => {
        calls.push('crops');
        if (fail) throw new Error('timeout');
        return CROPS;
      }),
    });
    const journey = new Journey(impl);
    journey.setPlot(SMALL);
    await journey.analyse();
    fail = false;
    await journey.analyse({ retry: true, useLandsat: false });

    expect(calls.filter((c) => c === 'climate')).toHaveLength(1);
    expect(impl.crops).toHaveBeenLastCalledWith('p1', expect.objectContaining({ useLandsat: false }));
    expect(journey.step).toBe('results');
  });

  it('a failed summary leaves the results standing', async () => {
    const journey = new Journey(api({ summary: vi.fn().mockRejectedValue(new Error('401')) }).impl);
    journey.setPlot(SMALL);
    await journey.analyse();
    await flush();

    expect(journey.step).toBe('results');
    expect(journey.summary.status).toBe('failed');
  });

  it('changing the plot drops the old analysis', async () => {
    const journey = new Journey(api().impl);
    journey.setPlot(SMALL);
    await journey.analyse();
    journey.setPlot(SMALL.slice(0, 4));

    expect(journey.climate).toBeNull();
    expect(journey.results).toBeNull();
  });

  it('cancel aborts and returns to draw with the plot kept', async () => {
    let signal: AbortSignal | undefined;
    const climate = vi.fn((_ring: unknown, opts: { signal?: AbortSignal }) => {
      signal = opts.signal;
      return new Promise<ClimateResponse>((_resolve, reject) => {
        opts.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    const journey = new Journey(api({ climate: climate as never }).impl);
    journey.setPlot(SMALL);

    const pending = journey.analyse();
    journey.cancel();
    await pending;

    expect(signal!.aborted).toBe(true);
    expect(journey.step).toBe('draw');
    expect(journey.plot).not.toBeNull();
    expect(journey.request.status).toBe('idle');
  });

  it('new plot clears plot and results but stays in the app', async () => {
    const journey = new Journey(api().impl);
    journey.setPlot(SMALL);
    await journey.analyse();
    journey.newPlot();

    expect(journey.step).toBe('draw');
    expect(journey.plot).toBeNull();
    expect(journey.results).toBeNull();
  });
});
