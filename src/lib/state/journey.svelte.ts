import { area as turfArea, polygon as turfPolygon } from '@turf/turf';
import { isAbortError } from '../api/client';
import { getRecommendations, type LngLat } from '../api/recommendations';
import type { RecommendationsResponse } from '../api/types';

export type Step = 'place' | 'draw' | 'analysing' | 'results';
export type CropFilter = 'all' | 'cool' | 'warm' | 'no-irrigation';

/** Same limit as the back end (api/main.py MAX_AREA_M2). */
export const MAX_AREA_M2 = 1_000_000;

export interface Plot {
  /** Closed GeoJSON ring, [lng, lat]. */
  ring: LngLat[];
  areaM2: number;
  corners: number;
  placeName: string | null;
}

export type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'error'; message: string };

type Fetcher = typeof getRecommendations;

export function plotFromRing(ring: LngLat[]): Plot {
  const closed =
    ring.length > 0 && (ring[0][0] !== ring.at(-1)![0] || ring[0][1] !== ring.at(-1)![1]) ? [...ring, ring[0]] : ring;
  const areaM2 = closed.length >= 4 ? turfArea(turfPolygon([closed])) : 0;
  return { ring: closed, areaM2, corners: Math.max(0, closed.length - 1), placeName: null };
}

export class Journey {
  step = $state<Step>('place');
  plot = $state<Plot | null>(null);
  request = $state<RequestState>({ status: 'idle' });
  results = $state<RecommendationsResponse | null>(null);
  filter = $state<CropFilter>('all');

  isTooLarge = $derived(this.plot !== null && this.plot.areaM2 > MAX_AREA_M2);
  canAnalyse = $derived(this.plot !== null && this.plot.corners >= 3 && !this.isTooLarge);

  #controller: AbortController | null = null;
  #fetch: Fetcher;

  constructor(fetcher: Fetcher = getRecommendations) {
    this.#fetch = fetcher;
  }

  goToPlace(): void {
    this.cancel();
    this.step = 'place';
  }

  startDrawing(): void {
    this.step = 'draw';
  }

  setPlot(ring: LngLat[] | null): void {
    const placeName = this.plot?.placeName ?? null;
    this.plot = ring ? { ...plotFromRing(ring), placeName } : null;
    if (this.step === 'place' && ring) this.step = 'draw';
  }

  setPlaceName(name: string | null): void {
    if (this.plot) this.plot = { ...this.plot, placeName: name };
  }

  clearPlot(): void {
    this.plot = null;
    this.results = null;
  }

  async analyse(): Promise<void> {
    if (!this.plot || !this.canAnalyse) return;

    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;

    this.step = 'analysing';
    this.results = null;
    this.filter = 'all';
    this.request = { status: 'loading', startedAt: Date.now() };

    try {
      const results = await this.#fetch(this.plot.ring, { signal: controller.signal });
      if (controller.signal.aborted) return;
      this.results = results;
      this.request = { status: 'idle' };
      this.step = 'results';
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      this.request = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      };
    } finally {
      if (this.#controller === controller) this.#controller = null;
    }
  }

  /** Stops a running analysis and returns to drawing with the plot kept. */
  cancel(): void {
    if (this.#controller) {
      this.#controller.abort();
      this.#controller = null;
    }
    if (this.step === 'analysing') this.step = 'draw';
    this.request = { status: 'idle' };
  }

  /** "New plot" on results: back to drawing, place kept, plot cleared. */
  newPlot(): void {
    this.cancel();
    this.clearPlot();
    this.step = 'draw';
  }
}

export const journey = new Journey();
