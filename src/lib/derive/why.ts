import type { CropRecommendation, RecommendationsResponse } from '../api/types';
import type { FactorKey } from './score';
import { formatNumber } from '../i18n/format';
import { i18n } from '../i18n/locale.svelte';

const n = (value: number) => formatNumber(Math.round(value));
const hours = (value: number) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** v1 back end: beyond this much surplus rain the water score dropped sharply (water_diff > 300). */
const WET_SURPLUS_MM_V1 = 300;
/** v2 back end: rain beyond the need starts to cost a little from this surplus. */
const WET_SURPLUS_MM = 150;

/**
 * One-line reason per score factor, from the numbers the back end scored with.
 * v2 responses carry growing-season figures (season_mean_temp, season_precipitation_mm, heat_capped);
 * older responses scored against the year-round average, so their wording says "year average".
 */
export function factorReasons(crop: CropRecommendation, climate: RecommendationsResponse['climate_summary']): Record<FactorKey, string> {
  const m = crop.suitability.metrics;
  const t = i18n.m.why;
  const seasonal = m.season_mean_temp !== undefined;

  let heat: string;
  if (m.total_gdd >= m.required_gdd) heat = t.heatMore(n(m.required_gdd));
  else if (m.heat_capped) heat = t.heatCapped(n(m.total_gdd), n(m.required_gdd));
  else heat = t.heatPart(n(m.total_gdd), n(m.required_gdd));

  const sunlight = t.sun(hours(m.adjusted_sun_hours));

  const label = seasonal ? t.seasonAverage : t.yearAverage;
  // The scoring pass judges temperature over the crop's own growing days; prefer that average when present.
  const growing = m.temperature_mean !== undefined ? m.temperature_mean : m.season_mean_temp;
  const average = seasonal ? growing : (climate.avg_temp_max + climate.avg_temp_min) / 2;
  let temperature: string;
  if (average === null || average === undefined) {
    temperature = t.tooColdAnyDay;
  } else if (m.optimal_temp_min !== undefined && m.optimal_temp_max !== undefined) {
    const range = `${m.optimal_temp_min}–${m.optimal_temp_max}°C`;
    temperature =
      average >= m.optimal_temp_min && average <= m.optimal_temp_max
        ? t.insideIdeal(label, range)
        : t.outsideIdeal(label, Math.round(average), range);
  } else {
    temperature = t.average(label, Math.round(average));
  }

  const rain = seasonal ? (m.season_precipitation_mm ?? m.annual_precipitation_mm) : m.annual_precipitation_mm;
  let water: string;
  if (m.irrigation_needed_mm > 0) water = t.watering(n(m.irrigation_needed_mm));
  else if (seasonal && rain - m.required_water_mm > WET_SURPLUS_MM) water = t.rainSurplus(n(rain), n(m.required_water_mm));
  else if (!seasonal && rain - m.required_water_mm > WET_SURPLUS_MM_V1) water = t.rainSurplusYear(n(rain), n(m.required_water_mm));
  else water = t.rainCovers(n(m.required_water_mm));

  return { gdd: heat, sunlight, temperature, water };
}

/** Below this score the crop page explains what held it back; Excellent crops need no excuse. */
const HELD_BACK_BELOW = 80;

/**
 * One plain line when the weakest factor a gardener cannot change held the score back
 * (back end `limited_by`) and the crop did not make Excellent; null otherwise.
 */
export function heldBack(crop: CropRecommendation): string | null {
  const m = crop.suitability.metrics;
  const t = i18n.m.why;
  if (crop.suitability.overall_score >= HELD_BACK_BELOW) return null;
  switch (m.limited_by) {
    case 'temperature': {
      const mean = m.temperature_mean;
      const ideal = m.optimal_temp_min !== undefined && m.optimal_temp_max !== undefined ? `${m.optimal_temp_min}–${m.optimal_temp_max}°C` : null;
      if (mean === null || mean === undefined) return t.heldTemperatureCold;
      return t.heldTemperature(Math.round(mean), ideal);
    }
    case 'heat':
      return t.heldHeat(n(m.total_gdd), n(m.required_gdd));
    case 'sun':
      return t.heldSun(hours(m.adjusted_sun_hours), m.optimal_sun_hours);
    default:
      return null;
  }
}

/** Neighbours in a ranking, for the up/down buttons. */
export function neighbours<T extends { crop_id: string }>(list: T[], id: string): { previous: T | null; next: T | null; index: number } {
  const index = list.findIndex((c) => c.crop_id === id);
  return {
    index,
    previous: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

/** The next few crops after this one (wrapping to the top), for "Also good here". */
export function alsoGood<T extends { crop_id: string }>(list: T[], id: string, count = 3): T[] {
  const others = list.filter((c) => c.crop_id !== id);
  const index = list.findIndex((c) => c.crop_id === id);
  const after = index >= 0 ? list.slice(index + 1) : others;
  return [...after, ...others.filter((c) => !after.includes(c))].slice(0, count);
}
