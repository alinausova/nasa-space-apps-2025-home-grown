// Three-call analysis API (api/main.py: /analysis/climate, /analysis/crops, /analysis/summary).
import { apiFetch } from './client';
import { toApiCoordinates, type LngLat } from './recommendations';
import type { CropRecommendation, RecommendationsResponse } from './types';
import { monthLong } from '../i18n/format';

export interface MonthlyClimate {
  month: number;
  temp_max: number;
  temp_min: number;
  temp_avg: number;
  precip_mm: number;
}

export interface ClimateResponse {
  plot_id: string;
  location: RecommendationsResponse['location'];
  year: number;
  climate: {
    avg_temp_max: number;
    avg_temp_min: number;
    annual_precipitation_mm: number;
    sun_hours_daily: number;
    sunshine_factor: number;
    growing_season: { start_month: number; end_month: number; days: number; all_year: boolean } | null;
    warmest_month: { month: number; temp_avg: number } | null;
    days_above_5c: number;
    winter_sun_hours: number;
  };
  monthly: MonthlyClimate[];
}

export type LandsatStatus = 'ok' | 'no_scenes' | 'timeout' | 'error' | 'disabled';

export interface LandsatBlock {
  status: LandsatStatus;
  scenes: { date: string; platform: string; surface_temp_c: number }[];
  surface_heat: { scenes: number; mean_surface_temp_c: number; mean_air_temp_max_c: number; offset_c: number; dates: string[] } | null;
}

export type MissReason =
  | { kind: 'sun'; needed_hours: number; available_hours: number }
  | { kind: 'too_cold' }
  | { kind: 'heat'; short_heat_units: number; approx_warm_days: number | null; beyond_a_year: boolean }
  | { kind: 'temperature'; season_mean_temp: number | null; ideal_min: number; ideal_max: number }
  | { kind: 'water'; irrigation_mm: number }
  | { kind: 'no_window' };

export interface AnalysedCrop extends CropRecommendation {
  usable: boolean;
  miss_reason?: MissReason;
}

export interface CropsResponse {
  plot_id: string;
  landsat: LandsatBlock;
  crops: AnalysedCrop[];
  total_usable: number;
}

export interface SummaryResponse {
  plot_id: string;
  lang?: string;
  summary: string | null;
  error?: string;
}

export interface TipsResponse {
  plot_id: string;
  crop_id: string;
  lang?: string;
  tips: string | null;
  error?: string;
}

type Options = { signal?: AbortSignal; fetchImpl?: typeof fetch };

export function fetchClimate(ring: LngLat[], { signal, fetchImpl }: Options = {}): Promise<ClimateResponse> {
  return apiFetch('/analysis/climate', { method: 'POST', body: JSON.stringify({ coordinates: toApiCoordinates(ring) }), signal }, fetchImpl);
}

export function fetchCrops(plotId: string, { useLandsat = true, signal, fetchImpl }: Options & { useLandsat?: boolean } = {}): Promise<CropsResponse> {
  return apiFetch('/analysis/crops', { method: 'POST', body: JSON.stringify({ plot_id: plotId, use_landsat: useLandsat }), signal }, fetchImpl);
}

/** `lang`: language the AI writes in (the app's locale). */
export function fetchSummary(plotId: string, { signal, fetchImpl, lang = 'en' }: Options & { lang?: string } = {}): Promise<SummaryResponse> {
  return apiFetch('/analysis/summary', { method: 'POST', body: JSON.stringify({ plot_id: plotId, lang }), signal }, fetchImpl);
}

export function fetchTips(plotId: string, cropId: string, { signal, fetchImpl, lang = 'en' }: Options & { lang?: string } = {}): Promise<TipsResponse> {
  return apiFetch('/analysis/tips', { method: 'POST', body: JSON.stringify({ plot_id: plotId, crop_id: cropId, lang }), signal }, fetchImpl);
}

export interface AnalysisApi {
  climate: typeof fetchClimate;
  crops: typeof fetchCrops;
  summary: typeof fetchSummary;
  tips: typeof fetchTips;
}

export const analysisApi: AnalysisApi = { climate: fetchClimate, crops: fetchCrops, summary: fetchSummary, tips: fetchTips };


/**
 * The result shape the v1 screens read, built from the v2 calls. Usable crops become `recommendations`.
 * The planting plan, crop list and crop detail read this; the climate card and "Nothing grows" read the v2 responses directly.
 */
export function toResults(climate: ClimateResponse, crops: CropsResponse, summary: string | null): RecommendationsResponse {
  const usable = crops.crops.filter((c) => c.usable);
  return {
    location: climate.location,
    year: climate.year,
    sunshine_factor: climate.climate.sunshine_factor,
    data_sources: {
      nasa_power: true,
      landsat_surface_temp: crops.landsat.status === 'ok',
      landsat_dates_available: crops.landsat.scenes.length,
    },
    climate_summary: {
      avg_temp_max: climate.climate.avg_temp_max,
      avg_temp_min: climate.climate.avg_temp_min,
      annual_precipitation_mm: climate.climate.annual_precipitation_mm,
      representative_sun_hours_daily: climate.climate.sun_hours_daily,
    },
    recommendations: usable,
    total_suitable_crops: crops.total_usable,
    total_filtered_by_sunlight: crops.crops.filter((c) => c.miss_reason?.kind === 'sun' && c.suitability.overall_score === 0).length,
    monthly_temperature_averages: {
      monthly_averages: climate.monthly.map((m) => ({
        month: m.month,
        month_name: monthLong(m.month - 1),
        avg_temp_max: m.temp_max,
        avg_temp_min: m.temp_min,
        avg_temp: m.temp_avg,
      })),
      years_analyzed: 1,
    },
    llm_summary: summary ?? undefined,
  };
}
