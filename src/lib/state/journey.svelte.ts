import { area as turfArea, polygon as turfPolygon } from '@turf/turf';
import { isAbortError } from '../api/client';
import type { LngLat } from '../api/recommendations';
import { analysisApi, toResults, type AnalysisApi, type ClimateResponse, type CropsResponse } from '../api/analysis';
import type { RecommendationsResponse } from '../api/types';
import type { Phase } from '../derive/progress';
import { loadEstimates, recordDuration } from './estimates';

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
  | { status: 'loading'; phase: Phase; startedAt: number; stepStartedAt: number }
  | { status: 'error'; phase: Phase; message: string }
  /** Crops are in, but Landsat did not answer: offer "Try again" or "Continue without Landsat". */
  | { status: 'landsat-failed' };

export type SummaryState = { status: 'idle' | 'loading' | 'failed' } | { status: 'done'; text: string };

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
  climate = $state<ClimateResponse | null>(null);
  crops = $state<CropsResponse | null>(null);
  summary = $state<SummaryState>({ status: 'idle' });
  /** Measured call durations, for "about N s left". */
  estimates = $state<Record<Phase, number>>(loadEstimates());
  filter = $state<CropFilter>('all');
  /** Sample city last jumped to (highlighted in the picker). */
  city = $state<string | null>(null);
  /** Previous plots for undo, oldest first. `null` = no plot. */
  history = $state<(LngLat[] | null)[]>([]);

  canUndo = $derived(this.history.length > 0);
  isTooLarge = $derived(this.plot !== null && this.plot.areaM2 > MAX_AREA_M2);
  canAnalyse = $derived(this.plot !== null && this.plot.corners >= 3 && !this.isTooLarge);
  /** Results in the shape the screens read; null until the crops are in. */
  results = $derived<RecommendationsResponse | null>(
    this.climate && this.crops ? toResults(this.climate, this.crops, this.summary.status === 'done' ? this.summary.text : null) : null,
  );

  #controller: AbortController | null = null;
  #summaryController: AbortController | null = null;
  #api: AnalysisApi;

  constructor(api: AnalysisApi = analysisApi) {
    this.#api = api;
  }

  goToPlace(): void {
    this.cancel();
    this.step = 'place';
  }

  startDrawing(): void {
    this.step = 'draw';
  }

  setPlot(ring: LngLat[] | null): void {
    if (this.plot || ring) this.history = [...this.history, this.plot?.ring ?? null].slice(-50);
    this.#applyRing(ring);
    if (this.step === 'place' && ring) this.step = 'draw';
  }

  /** Restores the previous plot; returns it so the map editor can show it. */
  undo(): LngLat[] | null {
    if (this.history.length === 0) return this.plot?.ring ?? null;
    const previous = this.history.at(-1) ?? null;
    this.history = this.history.slice(0, -1);
    this.#applyRing(previous);
    return previous;
  }

  #applyRing(ring: LngLat[] | null): void {
    const placeName = this.plot?.placeName ?? null;
    this.plot = ring ? { ...plotFromRing(ring), placeName } : null;
    this.#resetAnalysis(); // a different shape needs a fresh analysis
  }

  #resetAnalysis(): void {
    this.#summaryController?.abort();
    this.#summaryController = null;
    this.climate = null;
    this.crops = null;
    this.summary = { status: 'idle' };
  }

  setPlaceName(name: string | null): void {
    if (this.plot) this.plot = { ...this.plot, placeName: name };
  }

  clearPlot(): void {
    this.plot = null;
    this.#resetAnalysis();
    this.history = [];
  }

  /**
   * Climate, then crops. Results show when the crops arrive; the summary follows in the background.
   * `retry` keeps the climate already fetched for this plot ("starts from step 3").
   */
  async analyse({ retry = false, useLandsat = true }: { retry?: boolean; useLandsat?: boolean } = {}): Promise<void> {
    if (!this.plot || !this.canAnalyse) return;
    const ring = this.plot.ring;

    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    const { signal } = controller;

    this.step = 'analysing';
    this.filter = 'all';
    this.crops = null;
    this.summary = { status: 'idle' };
    if (!retry) this.climate = null;
    const startedAt = Date.now();

    let phase: Phase = 'climate';
    try {
      if (!this.climate) {
        this.request = { status: 'loading', phase, startedAt, stepStartedAt: Date.now() };
        const t0 = Date.now();
        const climate = await this.#api.climate(ring, { signal });
        if (signal.aborted) return;
        this.estimates = recordDuration(this.estimates, 'climate', Date.now() - t0);
        this.climate = climate;
      }

      phase = 'crops';
      this.request = { status: 'loading', phase, startedAt, stepStartedAt: Date.now() };
      const t1 = Date.now();
      const crops = await this.#api.crops(this.climate.plot_id, { useLandsat, signal });
      if (signal.aborted) return;
      this.estimates = recordDuration(this.estimates, 'crops', Date.now() - t1);
      this.crops = crops;
      void this.#loadSummary(this.climate.plot_id);
      if (useLandsat && (crops.landsat.status === 'timeout' || crops.landsat.status === 'error')) {
        this.request = { status: 'landsat-failed' };
        return;
      }
      this.request = { status: 'idle' };
      this.step = 'results';
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return;
      this.request = { status: 'error', phase, message: error instanceof Error ? error.message : 'Something went wrong.' };
    } finally {
      if (this.#controller === controller) this.#controller = null;
    }
  }

  async #loadSummary(plotId: string): Promise<void> {
    this.#summaryController?.abort();
    const controller = new AbortController();
    this.#summaryController = controller;
    this.summary = { status: 'loading' };
    try {
      const response = await this.#api.summary(plotId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      this.summary = response.summary ? { status: 'done', text: response.summary } : { status: 'failed' };
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      this.summary = { status: 'failed' };
    }
  }

  /** Landsat failed: show the results from NASA POWER alone (the crops are already scored). */
  continueWithoutLandsat(): void {
    if (!this.crops) return;
    this.crops = { ...this.crops, landsat: { status: 'disabled', scenes: [], surface_heat: null } };
    this.request = { status: 'idle' };
    this.step = 'results';
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

  /** Back from results to the editor with the same plot. */
  editPlot(): void {
    this.cancel();
    this.#resetAnalysis();
    this.step = 'draw';
  }

  /** "New plot" on results: back to drawing, place kept, plot cleared. */
  newPlot(): void {
    this.cancel();
    this.clearPlot();
    this.step = 'draw';
  }
}

export const journey = new Journey();
