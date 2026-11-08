import type { CropRecommendation } from '../api/types';
import type { CropFilter } from '../state/journey.svelte';

export function irrigationMm(crop: CropRecommendation): number {
  return crop.suitability.metrics.irrigation_needed_mm ?? 0;
}

export function needsWater(crop: CropRecommendation): boolean {
  return irrigationMm(crop) > 0;
}

export function matchesFilter(crop: CropRecommendation, filter: CropFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'cool':
      return crop.season === 'cool';
    case 'warm':
      return crop.season === 'warm';
    case 'no-irrigation':
      return !needsWater(crop);
  }
}

export function filterCrops(crops: CropRecommendation[], filter: CropFilter): CropRecommendation[] {
  return crops.filter((c) => matchesFilter(c, filter));
}
