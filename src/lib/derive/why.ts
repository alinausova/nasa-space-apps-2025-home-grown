import type { CropRecommendation, RecommendationsResponse } from '../api/types';
import type { FactorKey } from './score';

const n = (value: number) => Math.round(value).toLocaleString('en-US');

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
  const seasonal = m.season_mean_temp !== undefined;

  let heat: string;
  if (m.total_gdd >= m.required_gdd) heat = `More than the ${n(m.required_gdd)} heat units it needs`;
  else if (m.heat_capped) heat = `Only ${n(m.total_gdd)} of the ${n(m.required_gdd)} heat units it needs to mature`;
  else heat = `${n(m.total_gdd)} of ${n(m.required_gdd)} heat units`;

  const sunlight = `${m.adjusted_sun_hours.toFixed(1)} h a day after shade`;

  const label = seasonal ? 'Growing-season average' : 'Year average';
  const average = seasonal ? m.season_mean_temp : (climate.avg_temp_max + climate.avg_temp_min) / 2;
  let temperature: string;
  if (average === null || average === undefined) {
    temperature = 'Too cold to grow on any day';
  } else if (m.optimal_temp_min !== undefined && m.optimal_temp_max !== undefined) {
    const range = `${m.optimal_temp_min}–${m.optimal_temp_max}°C`;
    temperature =
      average >= m.optimal_temp_min && average <= m.optimal_temp_max
        ? `${label} inside the ideal ${range}`
        : `${label} ${Math.round(average)}°C, ideal ${range}`;
  } else {
    temperature = `${label} ${Math.round(average)}°C`;
  }

  const rain = seasonal ? (m.season_precipitation_mm ?? m.annual_precipitation_mm) : m.annual_precipitation_mm;
  let water: string;
  if (m.irrigation_needed_mm > 0) water = `Needs about ${n(m.irrigation_needed_mm)} mm of watering`;
  else if (seasonal && rain - m.required_water_mm > WET_SURPLUS_MM)
    water = `${n(rain)} mm of rain while it grows, more than its ${n(m.required_water_mm)} mm need`;
  else if (!seasonal && rain - m.required_water_mm > WET_SURPLUS_MM_V1)
    water = `${n(rain)} mm of rain, well over its ${n(m.required_water_mm)} mm need`;
  else water = `Rain covers its ${n(m.required_water_mm)} mm need`;

  return { gdd: heat, sunlight, temperature, water };
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
