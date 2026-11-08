import { describe, expect, it } from 'vitest';
import type { CropRecommendation } from '../api/types';
import { filterCrops, needsWater } from './crops';

function crop(id: string, season: string, irrigation: number): CropRecommendation {
  return { crop_id: id, season, suitability: { metrics: { irrigation_needed_mm: irrigation } } } as CropRecommendation;
}

const CROPS = [crop('kale', 'cool', 0), crop('beans', 'warm', 85), crop('tomatoes', 'warm', 0)];

describe('filterCrops', () => {
  it.each([
    ['all', ['kale', 'beans', 'tomatoes']],
    ['cool', ['kale']],
    ['warm', ['beans', 'tomatoes']],
    ['no-irrigation', ['kale', 'tomatoes']],
  ] as const)('%s', (filter, ids) => {
    expect(filterCrops(CROPS, filter).map((c) => c.crop_id)).toEqual(ids);
  });

  it('flags crops that need water', () => {
    expect(needsWater(CROPS[1])).toBe(true);
    expect(needsWater(CROPS[0])).toBe(false);
  });
});
