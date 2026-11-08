import type { CropRecommendation, RecommendationsResponse } from '../api/types';
import type { FactorKey } from './score';

const n = (value: number) => Math.round(value).toLocaleString('en-US');

/** Beyond this much surplus rain the back end's water score drops sharply (api/main.py, water_diff > 300). */
const WET_SURPLUS_MM = 300;

/**
 * One-line reason per score factor, from the numbers the back end scored with.
 * v1 scores temperature against the year-round average, so the wording says "year average".
 */
export function factorReasons(crop: CropRecommendation, climate: RecommendationsResponse['climate_summary']): Record<FactorKey, string> {
  const m = crop.suitability.metrics;

  const heat = m.total_gdd >= m.required_gdd ? `More than the ${n(m.required_gdd)} heat units it needs` : `${n(m.total_gdd)} of ${n(m.required_gdd)} heat units`;

  const sunlight = `${m.adjusted_sun_hours.toFixed(1)} h a day after shade`;

  const yearAverage = (climate.avg_temp_max + climate.avg_temp_min) / 2;
  let temperature: string;
  if (m.optimal_temp_min !== undefined && m.optimal_temp_max !== undefined) {
    const range = `${m.optimal_temp_min}–${m.optimal_temp_max}°C`;
    temperature =
      yearAverage >= m.optimal_temp_min && yearAverage <= m.optimal_temp_max
        ? `Year average inside the ideal ${range}`
        : `Year average ${Math.round(yearAverage)}°C, ideal ${range}`;
  } else {
    temperature = `Year average ${Math.round(yearAverage)}°C`;
  }

  // v1 scores water by distance from the need in both directions, so a lot of surplus rain lowers the score too.
  let water: string;
  if (m.irrigation_needed_mm > 0) water = `Needs about ${n(m.irrigation_needed_mm)} mm of watering`;
  else if (m.annual_precipitation_mm - m.required_water_mm > WET_SURPLUS_MM)
    water = `${n(m.annual_precipitation_mm)} mm of rain, well over its ${n(m.required_water_mm)} mm need`;
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
