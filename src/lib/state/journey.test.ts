import { describe, expect, it, vi } from 'vitest';
import type { LngLat } from '../api/recommendations';
import type { RecommendationsResponse } from '../api/types';
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

const RESULTS = { recommendations: [] } as unknown as RecommendationsResponse;

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
    const journey = new Journey(vi.fn());
    journey.setPlot(SMALL);

    expect(journey.step).toBe('draw');
    expect(journey.canAnalyse).toBe(true);
  });

  it('blocks plots over the limit', () => {
    const journey = new Journey(vi.fn());
    journey.setPlot(LARGE);

    expect(journey.plot!.areaM2).toBeGreaterThan(MAX_AREA_M2);
    expect(journey.isTooLarge).toBe(true);
    expect(journey.canAnalyse).toBe(false);
  });

  it('keeps the place name when the plot is redrawn', () => {
    const journey = new Journey(vi.fn());
    journey.setPlot(SMALL);
    journey.setPlaceName('Maxvorstadt, Munich');
    journey.setPlot(SMALL.slice(0, 4));

    expect(journey.plot!.placeName).toBe('Maxvorstadt, Munich');
  });

  it('analyses and shows results', async () => {
    const fetcher = vi.fn().mockResolvedValue(RESULTS);
    const journey = new Journey(fetcher);
    journey.setPlot(SMALL);

    const pending = journey.analyse();
    expect(journey.step).toBe('analysing');
    expect(journey.request.status).toBe('loading');

    await pending;
    expect(fetcher).toHaveBeenCalledWith(journey.plot!.ring, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(journey.step).toBe('results');
    expect(journey.results).toBe(RESULTS);
  });

  it('keeps the error on the analysing step', async () => {
    const journey = new Journey(vi.fn().mockRejectedValue(new Error('NASA POWER API returned 502')));
    journey.setPlot(SMALL);
    await journey.analyse();

    expect(journey.step).toBe('analysing');
    expect(journey.request).toEqual({ status: 'error', message: 'NASA POWER API returned 502' });
  });

  it('cancel aborts and returns to draw with the plot kept', async () => {
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((_ring, opts) => {
      signal = opts.signal;
      return new Promise<RecommendationsResponse>((_resolve, reject) => {
        opts.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    const journey = new Journey(fetcher as never);
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
    const journey = new Journey(vi.fn().mockResolvedValue(RESULTS));
    journey.setPlot(SMALL);
    await journey.analyse();
    journey.newPlot();

    expect(journey.step).toBe('draw');
    expect(journey.plot).toBeNull();
    expect(journey.results).toBeNull();
  });
});
